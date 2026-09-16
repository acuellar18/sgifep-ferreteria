import Modal from './Modal';

// Diálogo de confirmación para acciones destructivas o sensibles.
export default function ConfirmDialog({
  abierto,
  titulo,
  mensaje,
  confirmarTexto = 'Confirmar',
  onConfirmar,
  onCancelar
}) {
  return (
    <Modal abierto={abierto} titulo={titulo} onCerrar={onCancelar} ancho="420px">
      <p className="confirmar-mensaje">{mensaje}</p>
      <div className="modal-acciones">
        <button type="button" className="btn btn-secundario" onClick={onCancelar}>Cancelar</button>
        <button type="button" className="btn btn-danger" onClick={onConfirmar}>{confirmarTexto}</button>
      </div>
    </Modal>
  );
}