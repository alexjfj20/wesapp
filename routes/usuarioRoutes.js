const express = require('express');
const usuarioController = require('../controllers/usuarioController');
const { verificarToken, esSuperAdmin } = require('../middleware/auth');

const router = express.Router();

// Todas las rutas de usuarios requieren autenticación
router.use(verificarToken);

// Solo superadmin puede listar todos los usuarios
router.get('/', esSuperAdmin, usuarioController.obtenerUsuarios);
router.get('/:id', usuarioController.obtenerUsuario);
router.post('/', esSuperAdmin, usuarioController.crearUsuario);
router.put('/:id', usuarioController.actualizarUsuario);
router.patch('/:id/estado', esSuperAdmin, usuarioController.cambiarEstadoUsuario);
router.delete('/:id', esSuperAdmin, usuarioController.eliminarUsuario);

module.exports = router;
