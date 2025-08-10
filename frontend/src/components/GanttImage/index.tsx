import './styles.css';

function GanttImage() {
  return (
    <div className="gantt-container">
      <h2 className="gantt-title">Gráfico de Gantt</h2>
      <div className="gantt-image-wrapper">
        <img
          src="http://localhost:8000/media/gantt.png"
          alt="Gráfico de Gantt"
          className="gantt-image"
        />
      </div>
    </div>
  );
}

export default GanttImage;