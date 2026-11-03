import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <section className="reporte-compras">
          <header className="reporte-cabecera">
            <div>
              <h2>Reporte General</h2>
              <p>Ocurrió un error inesperado al cargar esta pantalla.</p>
            </div>
          </header>
          <div className="alerta alerta-error" style={{ margin: '20px' }}>
            <strong>Error:</strong> {this.state.error.message}
          </div>
          <div style={{ margin: '20px', textAlign: 'center' }}>
            <button type="button" className="btn btn-primario" onClick={() => { this.setState({ error: null }); window.location.reload(); }}>
              Reintentar
            </button>
          </div>
        </section>
      );
    }
    return this.props.children;
  }
}