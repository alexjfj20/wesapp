/**
 * Script para arreglar el problema de DataTypes en modelos
 * Ejecutar con: node scripts/fix-datatypes-issue.js
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
  
  // Verificar si contiene definición DataTypes
  const hasDataTypes = content.includes('const { DataTypes } = require(\'sequelize\');');
  
  if (hasDataTypes) {
    console.log(`🔧 Corrigiendo modelo: ${file}`);
    
    // Reemplazar la importación de DataTypes
    const updatedContent = content.replace(
      'const { DataTypes } = require(\'sequelize\');',
      '// DataTypes se obtiene ahora de models/index.js'
    );
    
    fs.writeFileSync(filePath, updatedContent);
    fixedFiles++;
  }
});

console.log(`✅ Proceso completado. Se corrigieron ${fixedFiles} archivos de modelos.`);

// Ahora actualizamos index.js para exportar DataTypes
const indexPath = path.join(modelsDir, 'index.js');
const indexContent = fs.readFileSync(indexPath, 'utf8');

if (!indexContent.includes('DataTypes,')) {
  console.log('🔧 Actualizando index.js para exportar DataTypes...');
  
  const updatedIndexContent = indexContent.replace(
    'const { Sequelize } = require(\'sequelize\');',
    'const { Sequelize, DataTypes } = require(\'sequelize\');'
  ).replace(
    'module.exports = {',
    'module.exports = {\n  DataTypes,'
  );
  
  fs.writeFileSync(indexPath, updatedIndexContent);
  console.log('✅ index.js actualizado correctamente.');
}

console.log('\n🚀 Script de corrección completado exitosamente!');
