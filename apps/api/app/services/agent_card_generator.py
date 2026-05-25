"""
Generates an A2A Agent Card JSON from builder form data.
"""

import hashlib
import json
from datetime import datetime, timezone


def generate_agent_card(builder_data: dict) -> dict:
    """
    Generate a valid Agent Card from builder form fields.

    Maps builder fields to the A2A Agent Card spec format:
    https://github.com/a2aproject/A2A/blob/main/docs/specification.md
    """
    card: dict = {
        "name": builder_data["name"],
        "description": builder_data.get("description", ""),
        "url": builder_data.get("url", ""),
        "version": builder_data.get("version", "1.0.0"),
    }

    # Provider
    provider_org = builder_data.get("provider_organization")
    provider_url = builder_data.get("provider_url")
    if provider_org or provider_url:
        card["provider"] = {}
        if provider_org:
            card["provider"]["organization"] = provider_org
        if provider_url:
            card["provider"]["url"] = provider_url

    # Documentation URL
    doc_url = builder_data.get("documentation_url")
    if doc_url:
        card["documentationUrl"] = doc_url

    # Icon URL
    icon_url = builder_data.get("icon_url")
    if icon_url:
        card["iconUrl"] = icon_url

    # Default modes
    card["defaultInputModes"] = builder_data.get("default_input_modes", ["text/plain"])
    card["defaultOutputModes"] = builder_data.get("default_output_modes", ["text/plain"])

    # Capabilities
    card["capabilities"] = builder_data.get("capabilities", {
        "streaming": False,
        "pushNotifications": False,
        "extendedAgentCard": False,
    })

    # Skills
    skills_data = builder_data.get("skills", [])
    card["skills"] = []
    for skill in skills_data:
        skill_card: dict = {
            "id": skill.get("external_skill_id") or skill["name"].lower().replace(" ", "-"),
            "name": skill["name"],
            "description": skill.get("description", ""),
        }
        if skill.get("tags"):
            skill_card["tags"] = skill["tags"]
        if skill.get("input_modes"):
            skill_card["inputModes"] = skill["input_modes"]
        if skill.get("output_modes"):
            skill_card["outputModes"] = skill["output_modes"]
        if skill.get("examples"):
            skill_card["examples"] = skill["examples"]
        card["skills"].append(skill_card)

    # Supported interfaces
    endpoints = builder_data.get("endpoints", [])
    if endpoints:
        card["supportedInterfaces"] = []
        for ep in endpoints:
            iface: dict = {
                "url": ep["base_url"],
                "protocolBinding": ep.get("protocol_binding", "JSONRPC"),
                "protocolVersion": ep.get("protocol_version", "0.2"),
            }
            if ep.get("tenant"):
                iface["tenant"] = ep["tenant"]
            card["supportedInterfaces"].append(iface)

    # Security
    security_schemes = builder_data.get("security_schemes")
    if security_schemes:
        card["securitySchemes"] = security_schemes

    security_requirements = builder_data.get("security_requirements")
    if security_requirements:
        card["securityRequirements"] = security_requirements

    # Metadata
    card["metadata"] = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "generator": "a2a-builder-registry",
    }

    return card


def compute_card_checksum(card: dict) -> str:
    raw = json.dumps(card, sort_keys=True, ensure_ascii=False)
    return hashlib.sha256(raw.encode()).hexdigest()
