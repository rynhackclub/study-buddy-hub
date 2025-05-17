import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Save, Calendar as CalendarIcon, ArrowLeft, ArrowRight } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DiaryEntry {
  id: string;
  date: string; // ISO string format
  content: string;
  mood: string;
}

const MOODS = ["😀", "🙂", "😐", "😔", "😢", "😡", "😴", "🤔", "🥳", "😎"];

const DailyDiary = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [content, setContent] = useState("");
  const [mood, setMood] = useState("");
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [hasEntry, setHasEntry] = useState(false);
  const { toast } = useToast();

  const dateKey = format(selectedDate, "yyyy-MM-dd");

  // Load entries from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem("diaryEntries");
    if (saved) {
      setEntries(JSON.parse(saved));
    }
  }, []);

  // Check if there's an entry for the selected date
  useEffect(() => {
    const entry = entries.find((e) => e.date.startsWith(dateKey));
    if (entry) {
      setContent(entry.content);
      setMood(entry.mood);
      setHasEntry(true);
    } else {
      setContent("");
      setMood("");
      setHasEntry(false);
    }
  }, [selectedDate, entries, dateKey]);

  // Save entries to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("diaryEntries", JSON.stringify(entries));
  }, [entries]);

  const handleSaveEntry = () => {
    if (!content.trim()) {
      toast({
        title: "Cannot save empty entry",
        description: "Please write something in your diary",
        variant: "destructive",
      });
      return;
    }

    const existingEntryIndex = entries.findIndex((e) => e.date.startsWith(dateKey));
    const newEntry: DiaryEntry = {
      id: Date.now().toString(),
      date: selectedDate.toISOString(),
      content,
      mood,
    };

    if (existingEntryIndex >= 0) {
      // Update existing entry
      const updatedEntries = [...entries];
      updatedEntries[existingEntryIndex] = newEntry;
      setEntries(updatedEntries);
    } else {
      // Add new entry
      setEntries([...entries, newEntry]);
    }

    toast({
      title: hasEntry ? "Entry updated!" : "Entry saved!",
      description: `Your diary entry for ${format(selectedDate, "MMMM d, yyyy")} has been saved`,
    });

    setHasEntry(true);
  };

  const navigateDay = (direction: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + direction);
    setSelectedDate(newDate);
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Daily Diary</h1>
      <p className="text-gray-600 mb-8">Reflect on your day and track your journey</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Calendar and Navigation */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Select Date</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="mb-4">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(selectedDate, "MMMM d, yyyy")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateDay(-1)}
                >
                  <ArrowLeft className="h-4 w-4 mr-1" /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateDay(1)}
                >
                  Next <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How do you feel?</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-2 justify-center">
                {MOODS.map((moodEmoji) => (
                  <button
                    key={moodEmoji}
                    className={`text-2xl p-2 rounded hover:bg-gray-100 transition-colors ${
                      mood === moodEmoji ? "bg-gray-200" : ""
                    }`}
                    onClick={() => setMood(moodEmoji)}
                  >
                    {moodEmoji}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Previous Entries</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 max-h-64 overflow-y-auto">
              {entries.length > 0 ? (
                <div className="space-y-2">
                  {entries
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((entry) => (
                      <Button
                        key={entry.id}
                        variant="outline"
                        className="w-full justify-start text-left"
                        onClick={() => setSelectedDate(new Date(entry.date))}
                      >
                        <span className="mr-2">{entry.mood || "📝"}</span>
                        <div className="flex flex-col items-start">
                          <span>{format(new Date(entry.date), "MMM d, yyyy")}</span>
                          <span className="text-xs text-gray-500 truncate w-full">
                            {entry.content.substring(0, 20)}
                            {entry.content.length > 20 ? "..." : ""}
                          </span>
                        </div>
                      </Button>
                    ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4">No entries yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Diary Entry */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center">
                {format(selectedDate, "MMMM d, yyyy")}
                {mood && <span className="ml-2 text-xl">{mood}</span>}
              </CardTitle>
              {hasEntry && (
                <div className="text-sm text-gray-500">
                  Last updated: {format(new Date(entries.find((e) => e.date.startsWith(dateKey))?.date || ""), "h:mm a")}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Write about your day..."
              className="min-h-[300px]"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </CardContent>
          <CardFooter>
            <Button className="ml-auto" onClick={handleSaveEntry}>
              <Save className="mr-2 h-4 w-4" />
              {hasEntry ? "Update Entry" : "Save Entry"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default DailyDiary;