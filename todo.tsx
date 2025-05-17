import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { CheckCheck, Plus, Trash2 } from "lucide-react";

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

const TodoList = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [completedTodos, setCompletedTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState("");
  const { toast } = useToast();
  
  // Load todos from localStorage
  useEffect(() => {
    const savedTodos = localStorage.getItem("todos");
    const savedCompletedTodos = localStorage.getItem("completedTodos");
    
    if (savedTodos) {
      try {
        setTodos(JSON.parse(savedTodos));
      } catch (error) {
        console.error("Error parsing saved todos:", error);
      }
    }
    
    if (savedCompletedTodos) {
      try {
        setCompletedTodos(JSON.parse(savedCompletedTodos));
      } catch (error) {
        console.error("Error parsing saved completed todos:", error);
      }
    }
  }, []);
  
  // Save todos to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("todos", JSON.stringify(todos));
    localStorage.setItem("completedTodos", JSON.stringify(completedTodos));
  }, [todos, completedTodos]);
  
  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTodo.trim()) return;
    
    const todo: Todo = {
      id: Date.now().toString(),
      text: newTodo.trim(),
      completed: false,
      createdAt: Date.now(),
    };
    
    setTodos([...todos, todo]);
    setNewTodo("");
    
    toast({
      title: "Task added",
      description: "New task has been added to your list",
    });
  };
  
  const handleToggleTodo = (id: string) => {
    const todoToToggle = todos.find(todo => todo.id === id);
    
    if (!todoToToggle) return;
    
    // Move to completed list
    setCompletedTodos([...completedTodos, {...todoToToggle, completed: true}]);
    
    // Remove from active list
    setTodos(todos.filter(todo => todo.id !== id));
    
    toast({
      title: "Task completed",
      description: "Task has been moved to completed tasks",
    });
  };
  
  const handleRestoreTodo = (id: string) => {
    const todoToRestore = completedTodos.find(todo => todo.id === id);
    
    if (!todoToRestore) return;
    
    // Move back to active list
    setTodos([...todos, {...todoToRestore, completed: false}]);
    
    // Remove from completed list
    setCompletedTodos(completedTodos.filter(todo => todo.id !== id));
    
    toast({
      title: "Task restored",
      description: "Task has been moved back to active tasks",
    });
  };
  
  const handleDeleteTodo = (id: string, isCompleted: boolean) => {
    if (isCompleted) {
      setCompletedTodos(completedTodos.filter(todo => todo.id !== id));
    } else {
      setTodos(todos.filter(todo => todo.id !== id));
    }
    
    toast({
      title: "Task deleted",
      description: "Task has been permanently removed",
      variant: "destructive",
    });
  };
  
  const handleClearCompletedHistory = () => {
    setCompletedTodos([]);
    
    toast({
      title: "History cleared",
      description: "All completed tasks have been removed",
    });
  };
  
  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Todo List</h1>
      <p className="text-gray-600 mb-6">Keep track of your daily tasks</p>
      
      <form onSubmit={handleAddTodo} className="flex gap-2 mb-8">
        <Input
          type="text"
          placeholder="Add a new task..."
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" className="flex items-center gap-2">
          <Plus size={16} />
          Add Task
        </Button>
      </form>
      
      <div className="space-y-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Tasks to do</CardTitle>
          </CardHeader>
          <CardContent>
            {todos.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No tasks to do yet. Add some tasks to get started!</p>
            ) : (
              <ul className="space-y-2">
                {todos.map(todo => (
                  <li key={todo.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-md group">
                    <Checkbox 
                      id={`todo-${todo.id}`} 
                      checked={todo.completed}
                      onCheckedChange={() => handleToggleTodo(todo.id)}
                      className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                    />
                    <label 
                      htmlFor={`todo-${todo.id}`} 
                      className="flex-1 cursor-pointer"
                    >
                      {todo.text}
                    </label>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDeleteTodo(todo.id, false)}
                    >
                      <Trash2 size={16} className="text-gray-400 hover:text-red-500" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle>Completed Tasks</CardTitle>
            {completedTodos.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-1">
                    <Trash2 size={14} />
                    Clear History
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all your completed tasks history. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearCompletedHistory}>
                      Yes, clear history
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </CardHeader>
          <CardContent>
            {completedTodos.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No completed tasks yet. Complete some tasks to see them here!</p>
            ) : (
              <ul className="space-y-2">
                {completedTodos.map(todo => (
                  <li key={todo.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-md group">
                    <div className="h-5 w-5 flex items-center justify-center">
                      <CheckCheck size={16} className="text-green-500" />
                    </div>
                    <span className="flex-1 line-through text-gray-500">{todo.text}</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRestoreTodo(todo.id)}
                      >
                        <CheckCheck size={16} className="text-gray-400 hover:text-green-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTodo(todo.id, true)}
                      >
                        <Trash2 size={16} className="text-gray-400 hover:text-red-500" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TodoList;0