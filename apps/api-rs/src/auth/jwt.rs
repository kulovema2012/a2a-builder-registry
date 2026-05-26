use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, Algorithm, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    pub sub: String,
    pub org: String,
    pub role: String,
    pub iat: i64,
    pub exp: i64,
}

pub fn encode_access_token(
    user_id: Uuid,
    org_id: Uuid,
    role: &str,
    secret: &str,
    ttl_secs: i64,
) -> anyhow::Result<String> {
    let now = Utc::now();
    let claims = Claims {
        sub: user_id.to_string(),
        org: org_id.to_string(),
        role: role.to_string(),
        iat: now.timestamp(),
        exp: (now + Duration::seconds(ttl_secs)).timestamp(),
    };
    let token = encode(
        &Header::new(Algorithm::HS256),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )?;
    Ok(token)
}

pub fn decode_token(token: &str, secret: &str) -> anyhow::Result<Claims> {
    let mut validation = Validation::new(Algorithm::HS256);
    validation.leeway = 0;
    let data = decode::<Claims>(
        token,
        &DecodingKey::from_secret(secret.as_bytes()),
        &validation,
    )?;
    Ok(data.claims)
}

pub fn generate_refresh_token() -> String {
    use std::fmt::Write;
    let bytes: [u8; 32] = rand_bytes();
    bytes.iter().fold(String::new(), |mut acc, b| {
        write!(acc, "{b:02x}").ok();
        acc
    })
}

pub fn hash_refresh_token(token: &str) -> String {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};
    format!("{:x}", {
        let mut h = DefaultHasher::new();
        token.hash(&mut h);
        h.finish()
    })
}

fn rand_bytes() -> [u8; 32] {
    use uuid::Uuid;
    let mut buf = [0u8; 32];
    let a = Uuid::new_v4().as_bytes().to_owned();
    let b = Uuid::new_v4().as_bytes().to_owned();
    buf[..16].copy_from_slice(&a);
    buf[16..].copy_from_slice(&b);
    buf
}

#[cfg(test)]
mod tests {
    use super::*;

    const SECRET: &str = "test-secret-with-minimum-32-chars-ok";

    #[test]
    fn test_encode_decode_roundtrip() {
        let user_id = Uuid::new_v4();
        let org_id = Uuid::new_v4();
        let token = encode_access_token(user_id, org_id, "member", SECRET, 900).unwrap();
        let claims = decode_token(&token, SECRET).unwrap();
        assert_eq!(claims.sub, user_id.to_string());
        assert_eq!(claims.org, org_id.to_string());
        assert_eq!(claims.role, "member");
    }

    #[test]
    fn test_expired_token_fails_decode() {
        let token =
            encode_access_token(Uuid::new_v4(), Uuid::new_v4(), "member", SECRET, -1).unwrap();
        let result = decode_token(&token, SECRET);
        assert!(result.is_err());
    }

    #[test]
    fn test_wrong_secret_fails_decode() {
        let token =
            encode_access_token(Uuid::new_v4(), Uuid::new_v4(), "member", SECRET, 900).unwrap();
        let result = decode_token(&token, "wrong-secret-wrong-secret-wrong-secret");
        assert!(result.is_err());
    }
}
