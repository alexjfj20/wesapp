/**
 * Script para corregir la importación y uso de DataTypes en los modelos
 * Ejecutar con: node scripts/fix-models-datatypes.js
 */
const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, '..', 'models');
const modelFiles = fs.readdirSync(modelsDir).filter(file => {
  return file !== 'index.js' && file !== 'index-simple.js' && file.endsWith('.js');
});

console.log(`🔍 Analizando ${modelFiles.length} archivos de modelos...`);

// Arreglar archivos de modelos
let fixedFiles = 0;
modelFiles.forEach(file => {
  const filePath = path.join(modelsDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Verificar si el archivo necesita ser corregido
  const needsFix = content.includes('// DataTypes se obtiene ahora de models/index.js') && !content.includes('const { DataTypes }');
  
  if (needsFix) {
    console.log(`🔧 Corrigiendo modelo: ${file}`);
    
    // Primero, modificar la importación para incluir DataTypes
    let updatedContent = content.replace(
      '// DataTypes se obtiene ahora de models/index.js',
      '// Importar DataTypes del módulo principal'
    );
    
    // Agregar DataTypes como importación
    updatedContent = updatedContent.replace(
      'const { sequelize: getSequelize } = require(\'../config/database\');',
      'const { sequelize: getSequelize } = require(\'../config/database\');\nconst { DataTypes } = require(\'sequelize\');'
    );
    
    fs.writeFileSync(filePath, updatedContent);
    fixedFiles++;
  }
});

console.log(`✅ Proceso completado. Se corrigieron ${fixedFiles} archivos de modelos.`);

// Verificar que index.js exporta correctamente DataTypes
const indexPath = path.join(modelsDir, 'index.js');
const indexContent = fs.readFileSync(indexPath, 'utf8');

if (indexContent.includes('const { Sequelize, DataTypes } = require(\'sequelize\');')) {
  // Verificar que DataTypes se exporta
  if (!indexContent.includes('module.exports = {') || !indexContent.includes('DataTypes,')) {
    console.log('🔧 Actualizando index.js para exportar DataTypes...');
    
    const updatedIndexContent = indexContent.replace(
      'module.exports = {',
      'module.exports = {\n  DataTypes,'
    );
    
    fs.writeFileSync(indexPath, updatedIndexContent);
    console.log('✅ index.js actualizado correctamente para exportar DataTypes.');
  } else {
    console.log('✓ index.js ya exporta correctamente DataTypes.');
  }
}

console.log('\n🚀 Script de corrección completado exitosamente!');
