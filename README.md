# Wallora - Plataforma de Fondos de Pantalla & Pre-Packs

Plataforma moderna y minimalista para explorar y descargar fondos de pantalla en alta definición (4K UHD, 8K y móviles) y agruparlos en packs personalizados (.ZIP).

## 🚀 Tecnologías
- **React 19** + **TypeScript**
- **Vite 8** (con `base: './'` listo para GitHub Pages)
- **Tailwind CSS v4** (tema oscuro y claro)
- **JSZip** (empaquetado y compresión de packs en tiempo real)
- **Lucide Icons**

## 📦 Cómo ejecutar localmente

1. Clona o pega los archivos en tu carpeta del proyecto.
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```
4. Abre tu navegador en `http://localhost:3000`.

## 🌐 Cómo desplegar en GitHub Pages

1. Sube los archivos a tu repositorio en GitHub:
   ```bash
   git add .
   git commit -m "feat: nuevo diseño minimalista y creador de packs"
   git push origin main
   ```
2. En GitHub, ve a **Settings** -> **Pages**.
3. En **Build and deployment -> Source**, selecciona **GitHub Actions**.
4. El archivo `.github/workflows/deploy.yml` compilará y publicará tu sitio automáticamente en `https://pascual3123.github.io/wallora/`.
