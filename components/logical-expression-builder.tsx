"use client"

import React, { useState } from 'react'
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { ScrollIcon } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Item {
  id: string
  name: string
  type: 'operator' | 'criteria'
  operator?: 'AND' | 'OR'
  children?: Item[]
}

const initialItems: Item[] = [
  {
    id: '1',
    name: 'Root',
    type: 'operator',
    operator: 'AND',
    children: [
      { id: '2', name: 'Age > 18', type: 'criteria' },
      { id: '3', name: 'Location = US', type: 'criteria' },
      {
        id: '4',
        name: 'Subgroup',
        type: 'operator',
        operator: 'OR',
        children: [
          { id: '5', name: 'Income > 50000', type: 'criteria' },
          { id: '6', name: 'Education = College', type: 'criteria' },
        ],
      },
    ],
  },
]

const LogicalItem: React.FC<{ 
  item: Item; 
  onMove: (draggedId: string, targetId: string) => void;
  onAddCriteria: (parentId: string) => void;
  onAddOperator: (parentId: string | null) => void;
  onChangeOperator: (id: string, operator: 'AND' | 'OR') => void;
  onRemoveOperator: (parentId: string) => void;
}> = ({ item, onMove, onAddCriteria, onAddOperator, onChangeOperator, onRemoveOperator }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'ITEM',
    item: { id: item.id, type: item.type },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  })

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'ITEM',
    canDrop: (draggedItem: Item) => item.type === 'operator',
    drop: (draggedItem: { id: string }, monitor) => {
      if (monitor.isOver({ shallow: true })) {
        onMove(draggedItem.id, item.id)
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver({ shallow: true }),
      canDrop: !!monitor.canDrop(),
    }),
  })

  return (
    <div 
      ref={drop}
      className={`flex flex-col items-start p-2 m-1 rounded-lg ${
        item.type === 'operator' ? 'bg-gray-100 border border-gray-300' : ''
      } ${isOver && canDrop ? 'bg-green-100' : ''}`}
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      <div ref={drag} className="w-full flex items-center mb-2">
        {item.type === 'operator' ? (
          <>
            <Select value={item.operator} onValueChange={(value: 'AND' | 'OR') => onChangeOperator(item.id, value)}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Operator" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AND">AND</SelectItem>
                <SelectItem value="OR">OR</SelectItem>
              </SelectContent>
            </Select>
          </>
        ) : (
          <div className='flex flex-row items-center border border-gray-500 w-full'>
            <ScrollIcon size={16} className="mr-2 text-blue-500" />
            <span>{item.name}</span>
          </div>
        )}
      </div>
      {item.type === 'operator' && (
        <div>
          {item.children?.map((child, index) => (
            <LogicalItem 
              key={child.id} 
              item={child} 
              onMove={onMove} 
              onAddCriteria={onAddCriteria}
              onAddOperator={onAddOperator}
              onChangeOperator={onChangeOperator}
              onRemoveOperator={onRemoveOperator}
            />
          ))}
          <div className="flex space-x-2 mt-2">
            <Button variant="outline" size="sm" onClick={() => onAddCriteria(item.id)}>
              Add Criteria
            </Button>
            <Button variant="outline" size="sm" onClick={() => onAddOperator(item.id)}>
              Add Operator
            </Button>
            <Button variant="outline" size="sm" onClick={() => onRemoveOperator(item.id)}>
              Remove Operator
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export function LogicalExpressionBuilderComponent() {
  const [items, setItems] = useState(initialItems)

  const moveItem = (draggedId: string, targetId: string) => {
    setItems((prevItems) => {
      const newItems = JSON.parse(JSON.stringify(prevItems))

      const findAndRemove = (items: Item[]): Item | null => {
        for (let i = 0; i < items.length; i++) {
          if (items[i].id === draggedId) {
            return items.splice(i, 1)[0]
          }
          if (items[i].children) {
            const found = findAndRemove(items[i].children!)
            if (found) return found
          }
        }
        return null
      }

      const findAndAdd = (items: Item[], item: Item): boolean => {
        for (let i = 0; i < items.length; i++) {
          if (items[i].id === targetId && items[i].type === 'operator') {
            items[i].children = items[i].children || []
            items[i].children.push(item)
            return true
          }
          if (items[i].children && findAndAdd(items[i].children, item)) {
            return true
          }
        }
        return false
      }

      const draggedItem = findAndRemove(newItems)
      if (draggedItem) {
        if (!findAndAdd(newItems, draggedItem)) {
          newItems[0].children?.push(draggedItem)
        }
      }

      return newItems
    })
  }

  const addCriteria = (parentId: string) => {
    const newCriteria: Item = {
      id: Date.now().toString(),
      name: 'New Criteria',
      type: 'criteria',
    }

    setItems((prevItems) => {
      const newItems = JSON.parse(JSON.stringify(prevItems))

      const addToParent = (items: Item[]): boolean => {
        for (let i = 0; i < items.length; i++) {
          if (items[i].id === parentId) {
            items[i].children = items[i].children || []
            items[i].children.push(newCriteria)
            return true
          }
          if (items[i].children && addToParent(items[i].children)) {
            return true
          }
        }
        return false
      }

      addToParent(newItems)
      return newItems
    })
  }

  const addOperator = (parentId: string | null) => {
    const newOperator: Item = {
      id: Date.now().toString(),
      name: 'New Operator',
      type: 'operator',
      operator: 'AND',
      children: [],
    }

    setItems((prevItems) => {
      const newItems = JSON.parse(JSON.stringify(prevItems))

      if (!parentId) {
        newItems.push(newOperator)
        return newItems
      }

      const addToParent = (items: Item[]): boolean => {
        for (let i = 0; i < items.length; i++) {
          if (items[i].id === parentId) {
            items[i].children = items[i].children || []
            items[i].children.push(newOperator)
            return true
          }
          if (items[i].children && addToParent(items[i].children)) {
            return true
          }
        }
        return false
      }

      addToParent(newItems)
      return newItems
    })
  }

  function removeItemById(items: Item[], id: string): Item[] {
    return items
      .filter((item) => item.id !== id)
      .map((item) => ({
        ...item,
        children: item.children ? removeItemById(item.children, id) : undefined,
      }));
  }

  const removeOperator = (parentId: string) => {
    setItems((prevItems) => removeItemById(prevItems, parentId))
  }

  const changeOperator = (id: string, operator: 'AND' | 'OR') => {
    setItems((prevItems) => {
      const newItems = JSON.parse(JSON.stringify(prevItems))

      const updateOperator = (items: Item[]): boolean => {
        for (let i = 0; i < items.length; i++) {
          if (items[i].id === id) {
            items[i].operator = operator
            return true
          }
          if (items[i].children && updateOperator(items[i].children)) {
            return true
          }
        }
        return false
      }

      updateOperator(newItems)
      return newItems
    })
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="p-4 bg-white rounded-lg shadow overflow-x-auto">
        <h2 className="text-2xl font-bold mb-4">Logical Expression Builder</h2>
        <div className="flex">
          {items.map((item) => (
            <LogicalItem 
              key={item.id} 
              item={item} 
              onMove={moveItem} 
              onAddCriteria={addCriteria}
              onAddOperator={addOperator}
              onRemoveOperator={removeOperator}
              onChangeOperator={changeOperator}
            />
          ))}
        </div>
      </div>
    </DndProvider>
  )
}
