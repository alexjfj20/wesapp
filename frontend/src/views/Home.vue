<template>
  <div class="home">
    <h1>Bienvenido a WebSAP</h1>
    <p>Sistema de Administración Web para Restaurantes</p>
    
    <div class="home-content">
      <div class="features">
        <h2>Características</h2>
        <ul>
          <li>Gestión de restaurantes</li>
          <li>Menú digital</li>
          <li>Reservaciones online</li>
          <li>Historial de pedidos</li>
          <li>Reportes y estadísticas</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Home',
  components: {},
  data() {
    return {};
  },
  mounted() {
    console.log('Vista Home montada');
  }
};
</script>

<style scoped>
.home {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

h1 {
  margin-bottom: 10px;
}

.home-content {
  margin-top: 40px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.features {
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 20px;
}

h2 {
  margin-top: 0;
}

ul {
  padding-left: 20px;
  margin-bottom: 0;
}

li {
  margin-bottom: 8px;
}
</style>