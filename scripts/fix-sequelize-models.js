/**
 * Script para corregir los modelos de Sequelize
 * Ejecutar con: node scripts/fix-sequelize-models.js
 */
const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, '..', 'models');

// Patrón para buscar en los archivos
const sequelizeFunctionPattern = /const\s+{\s*sequelize\s*}\s*=\s*require\(['"]\.\.\/(config|\.\.?)\/database['"]\);.*\nconst\s+\w+\s*=\s*sequelize\(\)\.define/;
const sequelizeFunctionReplacement = `const { DataTypes } = require('sequelize');
const { sequelize: getSequelize } = require('../config/database');

// Get the Sequelize instance directly
const sequelize = getSequelize();

const $MODEL_NAME = sequelize.define`;

// Leer todos los archivos en el directorio de modelos
console.log('🔍 Buscando modelos de Sequelize para corregir...');

let fixedModelsCount = 0;

fs.readdirSync(modelsDir).forEach(file => {
  // Ignorar index.js y archivos no JavaScript
  if (file === 'index.js' || file === 'index-simple.js' || !file.endsWith('.js')) {
    return;
  }
  
  const filePath = path.join(modelsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Comprobar si el archivo usa sequelize como función
  if (content.includes('sequelize().define')) {
    console.log(`🔧 Corrigiendo modelo: ${file}`);
    
    // Extraer el nombre del modelo
    const modelMatch = content.match(/const\s+(\w+)\s*=\s*sequelize\(\)\.define/);
    const modelName = modelMatch ? modelMatch[1] : file.replace('.js', '');
    
    // Reemplazar la importación y el uso de sequelize
    let newContent = content.replace(
      /const\s+{\s*sequelize\s*}\s*=\s*require\(['"]\.\.\/(config|\.\.?)\/database['"]\);/,
      `const { DataTypes } = require('sequelize');
const { sequelize: getSequelize } = require('../config/database');

// Get the Sequelize instance directly
const sequelize = getSequelize();`
    );
    
    // Reemplazar el uso de sequelize().define con sequelize.define
    newContent = newContent.replace(
      /sequelize\(\)\.define/g,
      'sequelize.define'
    );
    
    // Escribir el contenido corregido
    fs.writeFileSync(filePath, newContent);
    fixedModelsCount++;
  }
});

console.log(`✅ Proceso completado. Se corrigieron ${fixedModelsCount} modelos.`);
