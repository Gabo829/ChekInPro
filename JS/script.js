function formatoFechaHora(){
  const d = new Date();
  return d.toLocaleString('es-ES', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
}

document.getElementById('ingreso').addEventListener('click', ()=>{
  document.getElementById('ingresoTime').textContent = formatoFechaHora();
});

document.getElementById('salida').addEventListener('click', ()=>{
  document.getElementById('salidaTime').textContent = formatoFechaHora();
});
