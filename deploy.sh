#!/bin/bash
# ─── Script de Deploy — Portal Docente ──────────────────────────────────────
# Copia todos los archivos del staging al portal-docente real e instala deps.
# Ejecutar desde: /Users/albertocantillo/portal-estudiantes-creo/
# Uso: bash portal-docente-build/deploy.sh

STAGING="/Users/albertocantillo/portal-estudiantes-creo/portal-docente-build"
TARGET="/Users/albertocantillo/portal-docente"

echo "🚀 Iniciando deploy de Portal Docente..."

# 1. Copiar archivos de config raíz
cp "$STAGING/tailwind.config.js"  "$TARGET/tailwind.config.js"
cp "$STAGING/postcss.config.js"   "$TARGET/postcss.config.js"
cp "$STAGING/index.html"          "$TARGET/index.html"
echo "✅ Archivos de config copiados"

# 2. Copiar assets públicos desde portal-estudiante
STUDENT_PUBLIC="/Users/albertocantillo/portal-estudiantes-creo/portal-estudiante-creo/public"
cp "$STUDENT_PUBLIC/logo1_450x150.png"    "$TARGET/public/" 2>/dev/null && echo "✅ Logo copiado" || echo "⚠️  Logo no encontrado en portal estudiante"
cp "$STUDENT_PUBLIC/logo1_450x150.png.png" "$TARGET/public/" 2>/dev/null || true
cp "$STUDENT_PUBLIC/entrada_principal.jpg" "$TARGET/public/" 2>/dev/null && echo "✅ Imagen campus copiada" || echo "⚠️  Imagen campus no encontrada (puedes agregarla manualmente)"

# 3. Copiar src completo
mkdir -p "$TARGET/src/components/admin/tabs"
mkdir -p "$TARGET/src/services"
mkdir -p "$TARGET/src/utils"
mkdir -p "$TARGET/src/hooks"

cp "$STAGING/src/index.css"  "$TARGET/src/index.css"
cp "$STAGING/src/App.jsx"    "$TARGET/src/App.jsx"
cp "$STAGING/src/main.jsx"   "$TARGET/src/main.jsx"

cp "$STAGING/src/services/firebase.js"  "$TARGET/src/services/firebase.js"
cp "$STAGING/src/utils/helpers.js"      "$TARGET/src/utils/helpers.js"

cp "$STAGING/src/components/Toast.jsx"              "$TARGET/src/components/Toast.jsx"
cp "$STAGING/src/components/Header.jsx"             "$TARGET/src/components/Header.jsx"
cp "$STAGING/src/components/WelcomeScreen.jsx"      "$TARGET/src/components/WelcomeScreen.jsx"
cp "$STAGING/src/components/LoginModal.jsx"         "$TARGET/src/components/LoginModal.jsx"
cp "$STAGING/src/components/MaintenanceScreen.jsx"  "$TARGET/src/components/MaintenanceScreen.jsx"
cp "$STAGING/src/components/NotFoundScreen.jsx"     "$TARGET/src/components/NotFoundScreen.jsx"
cp "$STAGING/src/components/DocenteCard.jsx"        "$TARGET/src/components/DocenteCard.jsx"
cp "$STAGING/src/components/AdminPanel.jsx"         "$TARGET/src/components/AdminPanel.jsx"

cp "$STAGING/src/components/admin/AdminAnnouncement.jsx"  "$TARGET/src/components/admin/AdminAnnouncement.jsx"
cp "$STAGING/src/components/admin/AdminUploader.jsx"      "$TARGET/src/components/admin/AdminUploader.jsx"
cp "$STAGING/src/components/admin/DatabaseStatusCard.jsx" "$TARGET/src/components/admin/DatabaseStatusCard.jsx"

cp "$STAGING/src/components/admin/tabs/AdminDatosTab.jsx"     "$TARGET/src/components/admin/tabs/AdminDatosTab.jsx"
cp "$STAGING/src/components/admin/tabs/AdminRadarTab.jsx"     "$TARGET/src/components/admin/tabs/AdminRadarTab.jsx"
cp "$STAGING/src/components/admin/tabs/AdminAnalyticsTab.jsx" "$TARGET/src/components/admin/tabs/AdminAnalyticsTab.jsx"
cp "$STAGING/src/components/admin/tabs/AdminCrmTab.jsx"       "$TARGET/src/components/admin/tabs/AdminCrmTab.jsx"
cp "$STAGING/src/components/admin/tabs/AdminRolesTab.jsx"     "$TARGET/src/components/admin/tabs/AdminRolesTab.jsx"

cp "$STAGING/src/hooks/useAdminData.js"              "$TARGET/src/hooks/useAdminData.js"
cp "$STAGING/src/hooks/useAdminUploader.js"          "$TARGET/src/hooks/useAdminUploader.js"
cp "$STAGING/src/hooks/useAdminScheduleUploader.js"  "$TARGET/src/hooks/useAdminScheduleUploader.js"

echo "✅ Todos los archivos src copiados"

# 4. Actualizar package.json
cat > "$TARGET/package.json" << 'PKGJSON'
{
  "name": "portal-docente-creo",
  "private": true,
  "version": "2.0.0",
  "type": "module",
  "scripts": {
    "dev":     "vite",
    "build":   "vite build",
    "lint":    "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "firebase":          "^11.6.0",
    "framer-motion":     "^12.6.3",
    "react":             "^19.0.0",
    "react-dom":         "^19.0.0",
    "react-router-dom":  "^7.5.0",
    "swr":               "^2.3.3",
    "xlsx":              "^0.18.5"
  },
  "devDependencies": {
    "@eslint/js":                 "^9.17.0",
    "@types/react":               "^19.0.2",
    "@types/react-dom":           "^19.0.2",
    "@vitejs/plugin-react":       "^4.3.4",
    "autoprefixer":               "^10.4.20",
    "eslint":                     "^9.17.0",
    "eslint-plugin-react-hooks":  "^5.0.0",
    "eslint-plugin-react-refresh": "^0.4.16",
    "globals":                    "^15.14.0",
    "postcss":                    "^8.4.49",
    "tailwindcss":                "^3.4.17",
    "vite":                       "^6.0.5"
  }
}
PKGJSON

echo "✅ package.json actualizado"

# 5. Actualizar .env.local (agregar variables faltantes con placeholders)
cat >> "$TARGET/.env.local" << 'ENVFILE'

# ── Variables Firebase Auth (copiar desde Firebase Console) ──────────────────
# VITE_FIREBASE_API_KEY=AIza...
# VITE_FIREBASE_AUTH_DOMAIN=portal-creo-db.firebaseapp.com
# VITE_FIREBASE_PROJECT_ID=portal-creo-db
# VITE_FIREBASE_STORAGE_BUCKET=portal-creo-db.appspot.com
# VITE_FIREBASE_MESSAGING_SENDER_ID=...
# VITE_FIREBASE_APP_ID=1:...
# VITE_FIREBASE_MEASUREMENT_ID=G-...
ENVFILE

echo "✅ .env.local actualizado con placeholders"

# 6. Instalar dependencias
echo ""
echo "📦 Instalando dependencias (esto puede tardar 30-60 segundos)..."
cd "$TARGET" && npm install

echo ""
echo "🎉 ¡Deploy completado! Para iniciar el servidor de desarrollo:"
echo "   cd /Users/albertocantillo/portal-docente"
echo "   npm run dev"
echo ""
echo "⚠️  IMPORTANTE: Antes de iniciar, descomenta y completa las variables"
echo "   de Firebase en /Users/albertocantillo/portal-docente/.env.local"
