import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

export function TaskFilters({ onFilterChange, onSearch }) {
  return (
    <div className="flex gap-4 mb-6">
      <Input
        placeholder="Search tasks..."
        onChange={(e) => onSearch(e.target.value)}
        className="max-w-xs"
      />
      <Select 
        onValueChange={onFilterChange}
        defaultValue="all"
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Tasks</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="in-progress">In Progress</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="verified">Verified</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
