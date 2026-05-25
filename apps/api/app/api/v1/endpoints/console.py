import json
import time
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import httpx

from app.core.database import get_db
from app.models.models import Service, ServiceEndpoint
from app.schemas.schemas import TestConsoleRequest, TestConsoleResponse

router = APIRouter(prefix="/test-console", tags=["test-console"])


def _redact(obj: dict, max_depth: int = 5) -> dict:
    """Redact potential secrets from a dict for safe storage."""
    sensitive_keys = {"password", "secret", "token", "api_key", "apikey", "credential", "authorization"}
    if max_depth <= 0:
        return {"_redacted": "..."}
    result = {}
    for key, value in obj.items():
        if any(s in key.lower() for s in sensitive_keys):
            result[key] = "[REDACTED]"
        elif isinstance(value, dict):
            result[key] = _redact(value, max_depth - 1)
        elif isinstance(value, list):
            result[key] = [_redact(item, max_depth - 1) if isinstance(item, dict) else item for item in value]
        else:
            result[key] = value
    return result


@router.post("/send", response_model=TestConsoleResponse)
async def send_test_request(
    body: TestConsoleRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Send a sample A2A request to a registered service.
    Supports JSONRPC message/send for v1.
    """
    svc = await db.get(Service, body.service_id)
    if not svc:
        raise HTTPException(404, "Service not found")

    endpoint_id = body.endpoint_id
    if endpoint_id:
        endpoint = await db.get(ServiceEndpoint, endpoint_id)
    else:
        result = await db.execute(
            select(ServiceEndpoint)
            .where(ServiceEndpoint.service_id == body.service_id, ServiceEndpoint.is_preferred == True)
            .limit(1)
        )
        endpoint = result.scalar_one_or_none()

    if not endpoint:
        raise HTTPException(404, "No endpoint found for service")

    base_url = endpoint.base_url.rstrip("/")
    method = body.method

    # Build A2A JSONRPC request
    a2a_request = {
        "jsonrpc": "2.0",
        "method": method,
        "params": body.payload,
        "id": 1,
    }

    headers = {"Content-Type": "application/json"}
    if body.auth_credentials:
        for key, value in body.auth_credentials.items():
            if key.lower() == "authorization":
                headers["Authorization"] = value
            elif key.lower() == "api-key":
                headers["X-API-Key"] = value

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            start = time.monotonic()
            resp = await client.post(base_url, json=a2a_request, headers=headers)
            elapsed = int((time.monotonic() - start) * 1000)

            response_body = None
            try:
                response_body = resp.json()
            except json.JSONDecodeError:
                response_body = {"raw_response": resp.text[:2000]}

            return TestConsoleResponse(
                success=200 <= resp.status_code < 300,
                status_code=resp.status_code,
                response_body=_redact(response_body) if isinstance(response_body, dict) else response_body,
                response_time_ms=elapsed,
            )

    except httpx.TimeoutException:
        return TestConsoleResponse(
            success=False,
            error="Request timed out after 15 seconds",
        )
    except httpx.ConnectError:
        return TestConsoleResponse(
            success=False,
            error=f"Cannot connect to {base_url}",
        )
    except Exception as e:
        return TestConsoleResponse(
            success=False,
            error=str(e),
        )
