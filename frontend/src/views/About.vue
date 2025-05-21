<template>
  <div class="about">
    <h1>Acerca de WebSAP</h1>
    <div class="about-content">
      <p>WebSAP es un Sistema de Administración Web para Restaurantes desarrollado como una solución integral para gestionar operaciones diarias de establecimientos gastronómicos.</p>
      
      <h2>Nuestra Misión</h2>
      <p>Facilitar la gestión de restaurantes mediante herramientas digitales accesibles, intuitivas y eficientes, adaptadas a las necesidades específicas del sector gastronómico.</p>
      
      <h2>Características Principales</h2>
      <ul>
        <li><strong>Gestión de Restaurantes:</strong> Administra múltiples sucursales desde un solo panel.</li>
        <li><strong>Menú Digital:</strong> Actualiza tu menú en tiempo real y permite a los clientes consultarlo desde cualquier dispositivo.</li>
        <li><strong>Reservas Online:</strong> Sistema integrado de reservas para mesas.</li>
        <li><strong>Pedidos y Comandas:</strong> Gestión de pedidos en tiempo real.</li>
        <li><strong>Reportes y Estadísticas:</strong> Analiza el rendimiento de tu negocio con informes detallados.</li>
      </ul>
      
      <h2>Tecnologías</h2>
      <div class="technologies">
        <div class="tech-item">
          <span class="tech-icon">⚙️</span>
          <h3>Backend</h3>
          <p>Node.js, Express, Sequelize</p>
        </div>
        <div class="tech-item">
          <span class="tech-icon">🖥️</span>
          <h3>Frontend</h3>
          <p>Vue.js, Vuex, Vue Router</p>
        </div>
        <div class="tech-item">
          <span class="tech-icon">🛢️</span>
          <h3>Base de Datos</h3>
          <p>MySQL, SQLite (fallback)</p>
        </div>
      </div>
      
      <h2>Contacto</h2>
      <p>Para más información sobre WebSAP, no dudes en contactarnos a través de:</p>
      <p><strong>Email:</strong> info@websap.com</p>
      <p><strong>Teléfono:</strong> +1 (123) 456-7890</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'About'
}
</script>

<style scoped>
.about {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

h1 {
  margin-bottom: 20px;
}

h2 {
  margin-top: 30px;
  margin-bottom: 15px;
}

.about-content {
  line-height: 1.6;
}

ul {
  padding-left: 20px;
  margin-bottom: 20px;
}

li {
  margin-bottom: 10px;
}

.technologies {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-top: 20px;
}

.tech-item {
  flex: 1;
  min-width: 200px;
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
}

.tech-icon {
  font-size: 30px;
  display: block;
  margin-bottom: 10px;
}

.tech-item h3 {
  margin-top: 0;
  margin-bottom: 10px;
}

.tech-item p {
  margin: 0;
}

@media (max-width: 600px) {
  .technologies {
    flex-direction: column;
  }
}
</style>