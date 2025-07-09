import './styles.css';

interface QuantumOptimizationProps {
  onClick: () => void;
  isSelected: boolean;
}

function SelectQuantumOptimization({ onClick, isSelected }: QuantumOptimizationProps) {
  return (
    <div
      className={`optimization-card quantum ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
    >
      Otimização Quântica
    </div>
  );
}

export default SelectQuantumOptimization;