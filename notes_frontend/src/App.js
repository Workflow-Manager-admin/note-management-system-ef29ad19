import React, { useState, useEffect, useCallback } from "react";
import "./App.css";

// Demo categories (in a real application, these might be dynamic)
const DEFAULT_CATEGORIES = ["All", "Work", "Personal", "Ideas", "Other"];

/**
 * Note Card component for displaying, editing, and deleting a note
*/
function NoteCard({ note, onEdit, onDelete }) {
  return (
    <div className="note-card" data-testid="note-card">
      <div className="note-meta">
        <span className="note-category">{note.category}</span>
        <button className="note-action-btn" onClick={() => onEdit(note)}>
          ✏️
        </button>
        <button className="note-action-btn" onClick={() => onDelete(note.id)}>
          🗑️
        </button>
      </div>
      <h3 className="note-title">{note.title}</h3>
      <p className="note-body">{note.content}</p>
      <div className="note-date">
        {note.updatedAt
          ? `Updated: ${new Date(note.updatedAt).toLocaleString()}`
          : ""}
      </div>
    </div>
  );
}

/**
 * Sidebar for categories filter
 */
function Sidebar({ categories, selectedCategory, setSelectedCategory }) {
  return (
    <aside className="sidebar">
      <h2 className="sidebar-title">Categories</h2>
      <ul className="sidebar-list">
        {categories.map((cat) => (
          <li
            key={cat}
            className={`sidebar-item${selectedCategory === cat ? " active" : ""}`}
            onClick={() => setSelectedCategory(cat)}
            tabIndex={0}
            aria-pressed={selectedCategory === cat}
          >
            {cat}
          </li>
        ))}
      </ul>
    </aside>
  );
}

/**
 * Modal form for creating or editing notes
 */
function NoteModal({ open, onClose, onSubmit, initialData, categories }) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [category, setCategory] = useState(initialData?.category || categories[1] || "Work");

  useEffect(() => {
    if (open) {
      setTitle(initialData?.title || "");
      setContent(initialData?.content || "");
      setCategory(initialData?.category || categories[1] || "Work");
    }
  }, [open, initialData, categories]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      alert("Title cannot be empty.");
      return;
    }
    onSubmit({ title, content, category });
  };

  if (!open) return null;
  return (
    <div className="modal-overlay" data-testid="note-modal">
      <div className="modal">
        <h2>{initialData ? "Edit Note" : "New Note"}</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Title
            <input
              data-testid="title-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={64}
            />
          </label>
          <label>
            Content
            <textarea
              data-testid="content-input"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              required
              maxLength={512}
            />
          </label>
          <label>
            Category
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              data-testid="category-select"
            >
              {categories
                .filter((cat) => cat !== "All")
                .map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
            </select>
          </label>
          <div className="modal-actions">
            <button type="submit" className="modal-btn primary">
              {initialData ? "Update" : "Create"}
            </button>
            <button type="button" className="modal-btn" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Top navigation bar
 */
function Navbar({ onAddNote }) {
  return (
    <nav className="navbar">
      <div className="navbar-title">
        <span role="img" aria-label="Notes" style={{marginRight: 8}}>📝</span>
        Kavia Notes
      </div>
      <button className="navbar-add-btn" onClick={onAddNote}>
        ＋ Add Note
      </button>
    </nav>
  );
}

/**
 * Utilities for storing notes in localStorage
 */
const NOTES_LOCAL_STORAGE_KEY = "notes-app-storage-v1";
function loadNotes() {
  try {
    const data = JSON.parse(localStorage.getItem(NOTES_LOCAL_STORAGE_KEY));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
function saveNotes(notes) {
  localStorage.setItem(NOTES_LOCAL_STORAGE_KEY, JSON.stringify(notes));
}

/**
 * Main App Component
 */
// PUBLIC_INTERFACE
function App() {
  const [notes, setNotes] = useState([]);
  const [categories, setCategories] = useState([...DEFAULT_CATEGORIES]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [editNoteData, setEditNoteData] = useState(null);

  // Load notes from localStorage (first render only)
  useEffect(() => {
    const data = loadNotes();
    setNotes(data);
    const extraCats = [
      ...new Set(data.map((n) => n.category).filter((c) => !DEFAULT_CATEGORIES.includes(c))),
    ];
    setCategories([...DEFAULT_CATEGORIES, ...extraCats]);
  }, []);

  // Save notes to localStorage on change
  useEffect(() => {
    saveNotes(notes);
    const extraCats = [
      ...new Set(notes.map((n) => n.category).filter((c) => !DEFAULT_CATEGORIES.includes(c))),
    ];
    setCategories([...DEFAULT_CATEGORIES, ...extraCats]);
  }, [notes]);

  // PUBLIC_INTERFACE
  const openAddModal = () => {
    setEditNoteData(null);
    setModalOpen(true);
  };
  // PUBLIC_INTERFACE
  const openEditModal = (note) => {
    setEditNoteData(note);
    setModalOpen(true);
  };
  // PUBLIC_INTERFACE
  const closeModal = () => {
    setModalOpen(false);
  };

  // PUBLIC_INTERFACE
  const handleCreateOrUpdateNote = (data) => {
    if (editNoteData) {
      // Edit
      setNotes((prev) =>
        prev.map((n) =>
          n.id === editNoteData.id
            ? {
                ...n,
                ...data,
                updatedAt: Date.now(),
              }
            : n
        )
      );
    } else {
      // Create new note
      const newNote = {
        id: Date.now().toString() + "-" + Math.random().toString(16).slice(2),
        ...data,
        updatedAt: Date.now(),
      };
      setNotes((prev) => [newNote, ...prev]);
    }
    setModalOpen(false);
  };

  // PUBLIC_INTERFACE
  const handleDeleteNote = (id) => {
    if (window.confirm("Delete this note?")) {
      setNotes((prev) => prev.filter((n) => n.id !== id));
    }
  };

  // Keyboard shortcut to add note (Ctrl + N)
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault();
        openAddModal();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line
  }, []);

  const displayedNotes =
    selectedCategory === "All"
      ? notes
      : notes.filter((n) => n.category === selectedCategory);

  return (
    <div className="main-layout" data-theme="light">
      <Navbar onAddNote={openAddModal} />
      <div className="container">
        <Sidebar
          categories={categories}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
        />
        <main className="notes-main">
          {displayedNotes.length === 0 ? (
            <div className="empty-message">
              <p>
                <span role="img" aria-label="no-notes">
                  🗒️
                </span>{" "}
                {selectedCategory === "All"
                  ? "No notes yet. Click 'Add Note' to create one!"
                  : `No notes in ${selectedCategory}.`}
              </p>
            </div>
          ) : (
            <div className="notes-grid">
              {displayedNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onEdit={openEditModal}
                  onDelete={handleDeleteNote}
                />
              ))}
            </div>
          )}
        </main>
      </div>
      <NoteModal
        open={modalOpen}
        onClose={closeModal}
        onSubmit={handleCreateOrUpdateNote}
        initialData={editNoteData}
        categories={categories}
      />
    </div>
  );
}

export default App;
