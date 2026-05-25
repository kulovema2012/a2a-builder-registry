"""
Agent Card validation engine.

Validates an Agent Card JSON against the A2A specification requirements:
- Required fields present
- Schema structure correct
- Endpoint reachability
- Security metadata safety
- Skill definitions valid
"""

import hashlib
import json
import time
from datetime import datetime
from typing import Any

import httpx

REQUIRED_TOP_LEVEL = {"name", "description", "url"}
REQUIRED_INTERFACE_FIELDS = {"url"}
VALID_PROTOCOL_BINDINGS = {"JSONRPC", "GRPC", "HTTP+JSON"}
VALID_MEDIA_TYPES = {
    "text/plain", "text/html", "text/markdown",
    "application/json", "application/xml",
    "image/png", "image/jpeg", "image/gif", "image/webp",
    "audio/wav", "audio/mp3",
    "video/mp4",
}
REQUIRED_SKILL_FIELDS = {"id", "name", "description"}
CAPABILITY_FLAGS = {"streaming", "pushNotifications", "extendedAgentCard"}
SENSITIVE_KEY_PATTERNS = {"password", "secret", "token", "api_key", "apikey", "credential", "private_key"}


class ValidationResult:
    def __init__(self):
        self.checks: list[dict] = []
        self.errors: list[dict] = []
        self.warnings: list[dict] = []
        self.response_time_ms: int | None = None

    def add_check(self, name: str, status: str, message: str, field: str | None = None, details: dict | None = None):
        entry = {"check": name, "status": status, "message": message}
        if field:
            entry["field"] = field
        if details:
            entry["details"] = details
        self.checks.append(entry)
        if status == "failed":
            self.errors.append(entry)
        elif status == "warning":
            self.warnings.append(entry)

    @property
    def score(self) -> int:
        if not self.checks:
            return 0
        passed = sum(1 for c in self.checks if c["status"] == "passed")
        return int((passed / len(self.checks)) * 100)

    @property
    def status(self) -> str:
        if any(c["status"] == "failed" for c in self.checks):
            return "failed"
        if any(c["status"] == "warning" for c in self.checks):
            return "warning"
        if self.checks:
            return "passed"
        return "failed"

    def to_dict(self) -> dict:
        return {
            "status": self.status,
            "score": self.score,
            "checks": self.checks,
            "errors": self.errors,
            "warnings": self.warnings,
            "response_time_ms": self.response_time_ms,
        }


def compute_checksum(data: dict) -> str:
    raw = json.dumps(data, sort_keys=True, ensure_ascii=False)
    return hashlib.sha256(raw.encode()).hexdigest()


def _get_nested(data: dict, *keys, default=None) -> Any:
    current = data
    for key in keys:
        if isinstance(current, dict) and key in current:
            current = current[key]
        else:
            return default
    return current


def _find_sensitive_keys(data: Any, path: str = "") -> list[str]:
    """Recursively find keys that look like they contain secrets."""
    found = []
    if isinstance(data, dict):
        for key, value in data.items():
            current_path = f"{path}.{key}" if path else key
            lower_key = key.lower()
            if any(pattern in lower_key for pattern in SENSITIVE_KEY_PATTERNS):
                found.append(current_path)
            found.extend(_find_sensitive_keys(value, current_path))
    elif isinstance(data, list):
        for i, item in enumerate(data):
            found.extend(_find_sensitive_keys(item, f"{path}[{i}]"))
    return found


class AgentCardValidator:
    def __init__(self, timeout: int = 10, max_redirects: int = 3):
        self.timeout = timeout
        self.max_redirects = max_redirects

    async def validate_card(self, card_data: dict, fetch_endpoint: bool = True) -> ValidationResult:
        result = ValidationResult()
        start = time.monotonic()

        self._check_required_fields(card_data, result)
        self._check_string_fields(card_data, result)
        self._check_url_format(card_data, result)
        self._check_capabilities(card_data, result)
        self._check_skills(card_data, result)
        self._check_interfaces(card_data, result)
        self._check_default_modes(card_data, result)
        self._check_security(card_data, result)
        self._check_sensitive_data(card_data, result)

        if fetch_endpoint:
            await self._check_endpoint_reachability(card_data, result)

        result.response_time_ms = int((time.monotonic() - start) * 1000)
        return result

    def _check_required_fields(self, card: dict, result: ValidationResult):
        for field in REQUIRED_TOP_LEVEL:
            if field not in card or not card[field]:
                result.add_check(
                    "required_field", "failed",
                    f"Missing required field: '{field}'",
                    field=field,
                )
            else:
                result.add_check(
                    "required_field", "passed",
                    f"Required field present: '{field}'",
                    field=field,
                )

    def _check_string_fields(self, card: dict, result: ValidationResult):
        string_fields = {"name": 255, "description": 5000, "version": 50}
        for field, max_len in string_fields.items():
            value = card.get(field)
            if value is not None:
                if not isinstance(value, str):
                    result.add_check("field_type", "failed", f"'{field}' must be a string", field=field)
                elif len(value) > max_len:
                    result.add_check("field_length", "failed", f"'{field}' exceeds max length {max_len}", field=field)

    def _check_url_format(self, card: dict, result: ValidationResult):
        url = card.get("url", "")
        if url:
            if not url.startswith(("https://", "http://")):
                result.add_check("url_format", "failed", "Service URL must start with https:// or http://", field="url")
            elif not url.startswith("https://") and not _get_nested(card, "metadata", "dev", default=False):
                result.add_check("url_scheme", "warning", "Production services should use HTTPS", field="url")
            else:
                result.add_check("url_format", "passed", "Service URL format is valid", field="url")

    def _check_capabilities(self, card: dict, result: ValidationResult):
        capabilities = card.get("capabilities", {})
        if not capabilities:
            result.add_check("capabilities", "warning", "No capabilities declared", field="capabilities")
            return

        for flag in CAPABILITY_FLAGS:
            if flag in capabilities:
                if not isinstance(capabilities[flag], bool):
                    result.add_check("capability_type", "failed", f"Capability '{flag}' must be a boolean", field=f"capabilities.{flag}")

        result.add_check("capabilities", "passed", "Capabilities structure is valid", field="capabilities")

    def _check_skills(self, card: dict, result: ValidationResult):
        skills = card.get("skills", [])
        if not skills:
            result.add_check("skills", "warning", "No skills declared", field="skills")
            return

        seen_ids = set()
        for i, skill in enumerate(skills):
            if not isinstance(skill, dict):
                result.add_check("skill_type", "failed", f"Skill at index {i} must be an object", field=f"skills[{i}]")
                continue

            for req_field in REQUIRED_SKILL_FIELDS:
                if req_field not in skill or not skill[req_field]:
                    result.add_check(
                        "skill_required_field", "failed",
                        f"Skill '{skill.get('name', i)}' missing required field: '{req_field}'",
                        field=f"skills[{i}].{req_field}",
                    )

            skill_id = skill.get("id")
            if skill_id:
                if skill_id in seen_ids:
                    result.add_check("skill_id_unique", "failed", f"Duplicate skill id: '{skill_id}'", field=f"skills[{i}].id")
                seen_ids.add(skill_id)

            for mode_field in ("inputModes", "outputModes"):
                modes = skill.get(mode_field, [])
                for j, mode in enumerate(modes):
                    if mode not in VALID_MEDIA_TYPES:
                        result.add_check(
                            "skill_mode", "warning",
                            f"Skill '{skill.get('name', i)}' has unrecognized {mode_field}: '{mode}'",
                            field=f"skills[{i}].{mode_field}[{j}]",
                        )

        if not result.errors:
            result.add_check("skills", "passed", f"All {len(skills)} skill(s) are valid", field="skills")

    def _check_interfaces(self, card: dict, result: ValidationResult):
        interfaces = card.get("supportedInterfaces", [])
        if not interfaces:
            result.add_check("interfaces", "warning", "No interfaces declared", field="supportedInterfaces")
            return

        for i, iface in enumerate(interfaces):
            if not isinstance(iface, dict):
                result.add_check("interface_type", "failed", f"Interface at index {i} must be an object", field=f"supportedInterfaces[{i}]")
                continue

            for req_field in REQUIRED_INTERFACE_FIELDS:
                if req_field not in iface or not iface[req_field]:
                    result.add_check(
                        "interface_required_field", "failed",
                        f"Interface {i} missing required field: '{req_field}'",
                        field=f"supportedInterfaces[{i}].{req_field}",
                    )

            binding = iface.get("protocolBinding")
            if binding and binding not in VALID_PROTOCOL_BINDINGS:
                result.add_check(
                    "protocol_binding", "failed",
                    f"Invalid protocol binding: '{binding}'. Valid: {VALID_PROTOCOL_BINDINGS}",
                    field=f"supportedInterfaces[{i}].protocolBinding",
                )

        if not any(e.get("check") == "interface_required_field" for e in result.errors):
            result.add_check("interfaces", "passed", f"All {len(interfaces)} interface(s) are valid", field="supportedInterfaces")

    def _check_default_modes(self, card: dict, result: ValidationResult):
        for mode_field in ("defaultInputModes", "defaultOutputModes"):
            modes = card.get(mode_field, [])
            if not modes:
                result.add_check("default_modes", "warning", f"'{mode_field}' is empty", field=mode_field)
                continue
            for i, mode in enumerate(modes):
                if mode not in VALID_MEDIA_TYPES:
                    result.add_check(
                        "mode_type", "warning",
                        f"Unrecognized mode in '{mode_field}': '{mode}'",
                        field=f"{mode_field}[{i}]",
                    )
            if not any(e.get("field", "").startswith(mode_field) for e in result.warnings):
                result.add_check("default_modes", "passed", f"'{mode_field}' contains valid media types", field=mode_field)

    def _check_security(self, card: dict, result: ValidationResult):
        schemes = card.get("securitySchemes", {})
        requirements = card.get("securityRequirements", [])

        if not schemes and not requirements:
            result.add_check("security", "warning", "No security configuration declared", field="security")
            return

        if schemes and not isinstance(schemes, dict):
            result.add_check("security_schemes_type", "failed", "securitySchemes must be an object", field="securitySchemes")

        for scheme_name, scheme_def in schemes.items() if isinstance(schemes, dict) else []:
            if not isinstance(scheme_def, dict):
                result.add_check("security_scheme_type", "failed", f"Security scheme '{scheme_name}' must be an object")
                continue
            scheme_type = scheme_def.get("type")
            if not scheme_type:
                result.add_check("security_scheme_type_field", "failed", f"Security scheme '{scheme_name}' missing 'type'", field=f"securitySchemes.{scheme_name}.type")

        result.add_check("security", "passed", "Security metadata structure is valid", field="security")

    def _check_sensitive_data(self, card: dict, result: ValidationResult):
        sensitive_keys = _find_sensitive_keys(card)
        if sensitive_keys:
            result.add_check(
                "sensitive_data", "failed",
                f"Potential secrets found in public Agent Card: {', '.join(sensitive_keys[:5])}",
                details={"keys": sensitive_keys},
            )
        else:
            result.add_check("sensitive_data", "passed", "No sensitive data detected in public card")

    async def _check_endpoint_reachability(self, card: dict, result: ValidationResult):
        url = card.get("url")
        if not url:
            return

        agent_card_url = f"{url.rstrip('/')}/.well-known/agent-card.json"
        try:
            async with httpx.AsyncClient(
                timeout=self.timeout,
                max_redirects=self.max_redirects,
                follow_redirects=True,
            ) as client:
                start = time.monotonic()
                resp = await client.get(agent_card_url)
                elapsed = int((time.monotonic() - start) * 1000)

                if resp.status_code == 200:
                    content_type = resp.headers.get("content-type", "")
                    if "json" in content_type or resp.text.strip().startswith("{"):
                        try:
                            resp.json()
                            result.add_check(
                                "endpoint_reachability", "passed",
                                f"Agent Card endpoint reachable ({elapsed}ms)",
                                details={"url": agent_card_url, "response_time_ms": elapsed},
                            )
                        except json.JSONDecodeError:
                            result.add_check("endpoint_json", "failed", "Agent Card endpoint returned invalid JSON", field="url")
                    else:
                        result.add_check("endpoint_content_type", "warning", f"Agent Card returned non-JSON content-type: {content_type}", field="url")
                else:
                    result.add_check(
                        "endpoint_reachability", "failed",
                        f"Agent Card endpoint returned status {resp.status_code}",
                        field="url",
                        details={"url": agent_card_url, "status_code": resp.status_code},
                    )
        except httpx.TimeoutException:
            result.add_check("endpoint_timeout", "failed", f"Agent Card endpoint timed out after {self.timeout}s", field="url")
        except httpx.ConnectError as e:
            result.add_check("endpoint_connection", "failed", f"Cannot connect to endpoint: {e}", field="url")
        except Exception as e:
            result.add_check("endpoint_error", "failed", f"Endpoint check failed: {e}", field="url")


class AgentCardFetcher:
    """Fetches and parses an Agent Card from a URL."""

    def __init__(self, timeout: int = 10, max_redirects: int = 3):
        self.timeout = timeout
        self.max_redirects = max_redirects

    async def fetch(self, url: str) -> tuple[dict | None, str | None, int]:
        """
        Fetch Agent Card JSON from a URL.
        Returns (card_data, error_message, response_time_ms).
        """
        try:
            async with httpx.AsyncClient(
                timeout=self.timeout,
                max_redirects=self.max_redirects,
                follow_redirects=True,
            ) as client:
                start = time.monotonic()
                resp = await client.get(url)
                elapsed = int((time.monotonic() - start) * 1000)

                if resp.status_code != 200:
                    return None, f"HTTP {resp.status_code}", elapsed

                content_type = resp.headers.get("content-type", "")
                if "json" not in content_type and not resp.text.strip().startswith(("{", "[")):
                    return None, f"Invalid content-type: {content_type}", elapsed

                try:
                    data = resp.json()
                except json.JSONDecodeError as e:
                    return None, f"Invalid JSON: {e}", elapsed

                if not isinstance(data, dict):
                    return None, "Agent Card must be a JSON object", elapsed

                return data, None, elapsed

        except httpx.TimeoutException:
            return None, f"Request timed out after {self.timeout}s", 0
        except httpx.ConnectError:
            return None, "Connection failed", 0
        except Exception as e:
            return None, str(e), 0


def normalize_agent_card(raw: dict) -> dict:
    """Normalize an Agent Card into a consistent structure for storage and search."""
    normalized = {
        "name": raw.get("name", ""),
        "description": raw.get("description", ""),
        "url": raw.get("url", ""),
        "version": raw.get("version"),
        "documentationUrl": raw.get("documentationUrl"),
        "iconUrl": raw.get("iconUrl"),
        "provider": raw.get("provider"),
        "capabilities": raw.get("capabilities", {}),
        "defaultInputModes": raw.get("defaultInputModes", []),
        "defaultOutputModes": raw.get("defaultOutputModes", []),
        "skills": [],
        "supportedInterfaces": raw.get("supportedInterfaces", []),
        "securitySchemes": list(raw.get("securitySchemes", {}).keys()) if isinstance(raw.get("securitySchemes"), dict) else [],
        "securityRequirements": raw.get("securityRequirements", []),
        "signatures": raw.get("signatures", []),
    }

    for skill in raw.get("skills", []):
        if isinstance(skill, dict):
            normalized["skills"].append({
                "id": skill.get("id"),
                "name": skill.get("name"),
                "description": skill.get("description"),
                "tags": skill.get("tags", []),
                "inputModes": skill.get("inputModes", []),
                "outputModes": skill.get("outputModes", []),
            })

    return normalized
