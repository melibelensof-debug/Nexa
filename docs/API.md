# Nexa API Documentation

## Cloud Functions

### createPymeProfile
Crea un nuevo perfil de PYME para el usuario autenticado.

**Parámetros:**
- `businessName` (string): Nombre del negocio
- `sector` (string): Sector de la PYME (cosmética, electrónica, alimentos, etc.)
- `region` (string): Región donde está ubicada
- `description` (string): Descripción del negocio
- `website` (string, opcional): Sitio web del negocio

**Respuesta:**
```json
{
  "success": true,
  "message": "Perfil creado exitosamente"
}
```

### searchPymesByRegion
Busca PYMEs por región y sector.

**Parámetros:**
- `region` (string): Región para buscar
- `sector` (string, opcional): Sector específico

**Respuesta:**
```json
{
  "success": true,
  "pymes": [
    {
      "id": "user_id",
      "businessName": "Mi Negocio",
      "sector": "cosmética",
      "region": "Madrid",
      "description": "...",
      "createdAt": "2026-05-11T00:00:00Z"
    }
  ]
}
```

## Firestore Collections

### pymes
Colección de perfiles de PYMEs.

**Estructura:**
```json
{
  "businessName": "string",
  "sector": "string",
  "region": "string",
  "description": "string",
  "website": "string",
  "userId": "string",
  "createdAt": "timestamp",
  "ratings": "number",
  "reviews": "array"
}
```

### users
Perfiles de usuarios con información de contacto.

### messages
Mensajes entre PYMEs.
