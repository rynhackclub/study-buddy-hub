import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Play, Pause, Save, Clock, X } from "lucide-react";

interface TimerRecord {
  id: string;
  duration: number;
  date: string;
  label: string;
}

const Timer = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [label, setLabel] = useState("");
  const [records, setRecords] = useState<TimerRecord[]>(() => {
    const saved = localStorage.getItem("timerRecords");
    return saved ? JSON.parse(saved) : [];
  });
  
  const { toast } = useToast();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Load records from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem("timerRecords");
    if (saved) {
      setRecords(JSON.parse(saved));
    }
  }, []);
  
  // Save records to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("timerRecords", JSON.stringify(records));
  }, [records]);
  
  // Timer logic
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning]);
  
  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };
  
  const resetTimer = () => {
    setIsRunning(false);
    setSeconds(0);
    setLabel("");
  };
  
  const saveRecord = () => {
    if (seconds === 0) {
      toast({
        title: "Cannot save empty timer",
        description: "Please run the timer before saving a record",
        variant: "destructive",
      });
      return;
    }
    
    const newRecord: TimerRecord = {
      id: Date.now().toString(),
      duration: seconds,
      date: new Date().toISOString(),
      label: label || `Study Session ${records.length + 1}`,
    };
    
    setRecords([newRecord, ...records]);
    
    toast({
      title: "Record saved!",
      description: `You've saved a ${formatTime(seconds)} study session`,
    });
    
    resetTimer();
  };
  
  const deleteRecord = (id: string) => {
    setRecords(records.filter((record) => record.id !== id));
    
    toast({
      title: "Record deleted",
      description: "The timer record has been removed",
    });
  };
  
  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      seconds.toString().padStart(2, '0'),
    ].join(':');
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit' 
    }).format(date);
  };
  
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Study Timer</h1>
      <p className="text-gray-600 mb-8">Track your study sessions and improve productivity</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Timer Display */}
        <Card className="md:col-span-3 lg:col-span-1">
          <CardHeader>
            <CardTitle>Timer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-6xl font-mono text-center my-6">
              {formatTime(seconds)}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="label">Session Label (optional)</Label>
              <Input
                id="label"
                placeholder="What are you studying?"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                disabled={isRunning}
              />
            </div>
            
            <div className="flex gap-4">
              <Button
                className="flex-1 flex items-center justify-center"
                onClick={toggleTimer}
                variant={isRunning ? "outline" : "default"}
              >
                {isRunning ? (
                  <>
                    <Pause className="mr-2 h-4 w-4" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Start
                  </>
                )}
              </Button>
              
              <Button
                className="flex-1 flex items-center justify-center"
                variant="secondary"
                onClick={saveRecord}
                disabled={seconds === 0}
              >
                <Save className="mr-2 h-4 w-4" />
                Save
              </Button>
            </div>
            
            <Button
              className="w-full"
              variant="outline"
              onClick={resetTimer}
              disabled={seconds === 0}
            >
              Reset
            </Button>
          </CardContent>
        </Card>
        
        {/* Records Table */}
        <Card className="md:col-span-3 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-5 w-5" />
              Study History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {records.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Label</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.label}</TableCell>
                        <TableCell>{formatTime(record.duration)}</TableCell>
                        <TableCell>{formatDate(record.date)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteRecord(record.id)}
                          >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-10">
                <Clock className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <h3 className="text-lg font-medium">No records yet</h3>
                <p className="text-gray-500 mb-4">Start the timer and save your study sessions</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Timer;
