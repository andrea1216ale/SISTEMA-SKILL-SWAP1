# Estructura CSS por Componente

Este directorio contiene archivos CSS organizados por componente, siguiendo una estructura modular.

## Archivos CSS

### Global
- **global.css** - Estilos globales, reset CSS y variables de color comunes

### Autenticación
- **login-intro.css** - Estilos del panel introductorio/branding en la página de login
- **login-form.css** - Estilos del formulario de login
- **register-form.css** - Estilos del formulario de registro

### Dashboard
- **dashboard.css** - Estilos del dashboard principal (layout, sidebar, métricas, paneles)

### Componentes
- **header.css** - Estilos del componente header
- **footer.css** - Estilos del componente footer
- **chat-widget.css** - Estilos del widget de chat
- **exchange-card.css** - Estilos de la tarjeta de intercambio
- **skill-card.css** - Estilos de la tarjeta de habilidad

### Utilidades
- **back-button.css** - Estilos del botón regresar

## Importación en HTML

Cada página HTML importa los archivos CSS necesarios según su contenido:

### Páginas de Autenticación
```html
<link rel="stylesheet" href="css/global.css">
<link rel="stylesheet" href="css/login-intro.css">
<link rel="stylesheet" href="css/login-form.css">
```

```html
<link rel="stylesheet" href="css/global.css">
<link rel="stylesheet" href="css/login-intro.css">
<link rel="stylesheet" href="css/register-form.css">
```

### Página de Dashboard
```html
<link rel="stylesheet" href="css/global.css">
<link rel="stylesheet" href="css/dashboard.css">
<link rel="stylesheet" href="css/header.css">
<link rel="stylesheet" href="css/footer.css">
```

### Otras Páginas
```html
<link rel="stylesheet" href="css/global.css">
<link rel="stylesheet" href="css/header.css">
<link rel="stylesheet" href="css/footer.css">
<link rel="stylesheet" href="css/{component}.css">
```

## Ventajas de esta estructura

1. **Mantenibilidad** - Cada componente tiene sus propios estilos en un archivo separado
2. **Reutilización** - Los estilos globales se pueden compartir entre todas las páginas
3. **Performance** - Los navegadores pueden cachear los archivos CSS individuales
4. **Escalabilidad** - Es fácil agregar nuevos componentes sin afectar los existentes
5. **Colaboración** - Múltiples desarrolladores pueden trabajar en diferentes componentes sin conflictos

## Archivo Original

- **style.css.backup** - Copia de seguridad del archivo CSS monolítico original
