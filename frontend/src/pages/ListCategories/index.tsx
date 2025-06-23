import './styles.css';
import Header from '../../components/Header';
import { useState } from 'react';
import GetCategories, { Category } from '../../components/GetCategories';
import GetCategory from '../../components/GetCategory';

function ListCategories() {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [popoverPosition, setPopoverPosition] = useState<{ x: number; y: number } | null>(null);

  function handleCategorySelect(category: Category, event: React.MouseEvent<HTMLLIElement, MouseEvent>) {
    setSelectedCategory(category);
    setPopoverPosition({
      x: event.clientX,
      y: event.clientY,
    });
  }

  function handleClosePopover() {
    setSelectedCategory(null);
    setPopoverPosition(null);
  }

  return (
    <>
      <Header />
      <div className="list-categories-container">
        <div className="main-title">
          <h1>Lista de Categorias</h1>
        </div>

        <GetCategories
          onSelectCategory={handleCategorySelect}
          selectedCategory={selectedCategory ? [selectedCategory] : []}
        />

        {selectedCategory && popoverPosition && (
          <div
            className="get-category-popover"
            style={{
              position: 'absolute',
              top: popoverPosition.y + 10,
              left: popoverPosition.x + 10,
              zIndex: 9999,
            }}
          >
            <button
              onClick={handleClosePopover}
              style={{
                float: 'right',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: '16px',
                color: '#999',
              }}
            >
              ✖
            </button>
            <GetCategory categoryId={selectedCategory.id} />
          </div>
        )}
      </div>
    </>
  );
}

export default ListCategories;