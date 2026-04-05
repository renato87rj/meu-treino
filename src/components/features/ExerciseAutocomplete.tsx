import React, { useState, useRef, useEffect, useMemo } from 'react';
import Fuse from 'fuse.js';
import exerciseDatabase from '../../data/exerciseDatabase';

/**
 * Componente de autocomplete para nomes de exercícios.
 * Combina o banco estático com exercícios já usados pelo usuário.
 *
 * @param {string} value - Valor atual do input
 * @param {function} onChange - Callback quando o valor muda (recebe string)
 * @param {string} placeholder - Placeholder do input
 * @param {string} className - Classes CSS do input
 * @param {string[]} userExercises - Nomes de exercícios já usados pelo usuário
 */
interface ExerciseItem {
  name: string;
  group: string;
  isUser?: boolean;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  userExercises?: string[];
}

export default function ExerciseAutocomplete({
  value,
  onChange,
  placeholder = 'Nome do exercício',
  className = '',
  userExercises = [],
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [suppressAutoOpen, setSuppressAutoOpen] = useState(false);
  const [manuallyClosed, setManuallyClosed] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Monta a lista combinada: exercícios do usuário primeiro, depois do banco
  const allExercises = useMemo(() => {
    const userSet = new Set(userExercises.map(n => n.toLowerCase()));
    const userItems: ExerciseItem[] = userExercises.map(name => ({ name, group: 'Meus exercícios', isUser: true }));
    const dbFiltered: ExerciseItem[] = exerciseDatabase.filter((ex: ExerciseItem) => !userSet.has(ex.name.toLowerCase()));
    return [...userItems, ...dbFiltered];
  }, [userExercises]);

  // Configura Fuse.js
  const fuse = useMemo(() => {
    return new Fuse(allExercises, {
      keys: ['name'],
      threshold: 0.35,
      distance: 100,
      minMatchCharLength: 1,
    });
  }, [allExercises]);

  // Resultados filtrados
  const results = useMemo(() => {
    if (!value || value.trim().length < 2) return [];
    const found = fuse.search(value, { limit: 8 });
    return found.map(r => r.item);
  }, [value, fuse]);

  const shouldShow =
    isOpen &&
    !manuallyClosed &&
    !suppressAutoOpen &&
    results.length > 0;

  // Fecha ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setManuallyClosed(true);
        setHighlightIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll do item destacado
  useEffect(() => {
    if (highlightIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightIndex];
      if (item) item.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightIndex]);

  const handleSelect = (name: string) => {
    setSuppressAutoOpen(true);
    setManuallyClosed(true);
    onChange(name);
    setIsOpen(false);
    setHighlightIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex(prev => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex(prev => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter' && highlightIndex >= 0) {
      e.preventDefault();
      handleSelect(results[highlightIndex].name);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setManuallyClosed(true);
      setHighlightIndex(-1);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => {
          setSuppressAutoOpen(false);
          setManuallyClosed(false);
          onChange(e.target.value);
          setIsOpen(true);
          setHighlightIndex(-1);
        }}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (!suppressAutoOpen && !manuallyClosed && results.length > 0) setIsOpen(true);
        }}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />

      {shouldShow && (
        <ul
          ref={listRef}
          className="absolute z-50 left-0 right-0 mt-1 max-h-[220px] overflow-y-auto
                     rounded-[14px] border border-purple-500/25 shadow-xl"
          style={{
            background: 'rgba(15, 10, 30, 0.97)',
            backdropFilter: 'blur(16px)',
          }}
        >
          {results.map((item, idx) => (
            <li
              key={`${item.name}-${idx}`}
              onClick={() => handleSelect(item.name)}
              className={`flex items-center justify-between px-4 py-2.5 cursor-pointer
                          transition-colors border-b border-purple-500/[0.07] last:border-0
                          ${idx === highlightIndex
                            ? 'bg-purple-500/20'
                            : 'active:bg-purple-500/10'}`}
            >
              <span className="text-[13px] text-white truncate">{item.name}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 ml-2
                                ${item.isUser
                                  ? 'bg-purple-500/15 text-purple-300 border border-purple-500/20'
                                  : 'bg-white/[0.04] text-[#4a4568] border border-purple-500/[0.08]'}`}>
                {item.group}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
