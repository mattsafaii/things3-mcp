# Things 3 MCP Server

A Model Context Protocol (MCP) server that provides comprehensive integration with Things 3, the award-winning task management app for macOS. This server enables AI assistants to interact with your Things 3 database through natural language commands.

## Features

### Task Management
- ✅ **Add tasks** with rich metadata (notes, projects, areas, due dates, tags)
- ✅ **List tasks** from any Things 3 list (Inbox, Today, Upcoming, Anytime, Someday, Completed)
- ✅ **Complete tasks** individually or in bulk
- ✅ **Update tasks** with new properties
- ✅ **Delete tasks** permanently
- ✅ **Search tasks** by name or content
- ✅ **Defer tasks** with smart scheduling options

### Organization
- 📁 **Manage projects** and areas
- 🏷️ **Tag management** with usage statistics
- 🔍 **Filter by project, area, or tag**
- 📅 **Due date management** and overdue tracking

### Productivity Features
- 🎯 **Get next actions** - find tasks ready to work on
- ⏰ **Overdue task tracking**
- 🏷️ **Bulk operations** for efficiency
- 📊 **Tag usage analytics**

## Requirements

- **macOS** (Things 3 is macOS-only)
- **Things 3** app installed and accessible
- **Node.js** 18 or later
- **AppleScript** permissions for automation

## Installation

1. Clone or download this repository:
```bash
git clone https://github.com/mattsafaii/things3-mcp.git
cd things3-mcp
```

2. Install dependencies:
```bash
npm install
```

3. Make the server executable:
```bash
chmod +x index.js
```

## Configuration

### MCP Client Setup

Add this server to your MCP client configuration. For example, in Claude Desktop:

```json
{
  "mcpServers": {
    "things3": {
      "command": "node",
      "args": ["/path/to/things3-mcp/index.js"],
      "env": {}
    }
  }
}
```

### Permissions

When first running the server, macOS will request permissions for:
- **Accessibility** access for AppleScript automation
- **Things 3** access for reading and writing data

Grant these permissions in **System Preferences > Security & Privacy > Privacy**.

## Usage Examples

Once configured with your MCP client, you can use natural language commands:

### Basic Task Management
- *"Add a task called 'Review quarterly reports' with notes 'Focus on Q3 performance'"*
- *"Show me my tasks for today"*
- *"Complete the task 'Call dentist'"*
- *"What tasks are overdue?"*

### Organization
- *"List all my projects"*
- *"Show tasks in the 'Work' area"*
- *"Find tasks tagged with 'urgent'"*
- *"Create a new project called 'Website Redesign'"*

### Advanced Operations
- *"Get my next 5 available actions"*
- *"Defer 'Clean garage' until next weekend"*
- *"Add the tag 'waiting' to the task 'Follow up with client'"*
- *"Complete all tasks with the tag 'quick-wins'"*

## API Reference

### Task Operations

#### `add_task`
Add a new task to Things 3.
- `name` (required): Task name
- `notes` (optional): Task notes
- `project` (optional): Project name
- `area` (optional): Area name  
- `due_date` (optional): Due date (YYYY-MM-DD format)
- `tags` (optional): Array of tag names

#### `list_tasks`
List tasks from specified list.
- `list_type` (optional): `inbox`, `today`, `upcoming`, `anytime`, `someday`, `completed` (default: `today`)
- `project` (optional): Filter by project name
- `area` (optional): Filter by area name

#### `complete_task`
Mark a task as completed.
- `task_name` (required): Name of task to complete

#### `update_task`
Update an existing task's properties.
- `task_name` (required): Current task name
- `new_name` (optional): New task name
- `notes` (optional): New task notes
- `due_date` (optional): New due date (YYYY-MM-DD)
- `project` (optional): Move to project
- `area` (optional): Move to area

#### `delete_task`
Delete a task permanently.
- `task_name` (required): Name of task to delete

#### `search_tasks`
Search for tasks by name or content.
- `query` (required): Search query string

### Organization

#### `list_projects`
List all projects and areas.

#### `create_project`
Create a new project.
- `name` (required): Project name
- `area` (optional): Area to place project in
- `notes` (optional): Project notes

#### `list_tags`
List all existing tags with usage counts.

#### `list_tasks_by_tag`
List tasks filtered by tag.
- `tag_name` (required): Tag name to filter by
- `list_type` (optional): Which list to query (default: `all`)

### Advanced Features

#### `get_overdue_tasks`
Get all overdue tasks.
- `include_no_due_date` (optional): Include tasks with no due date (default: false)

#### `defer_task`
Reschedule a task for later.
- `task_name` (required): Name of task to defer
- `defer_option` (required): `tomorrow`, `next_week`, `weekend`, or `custom`
- `custom_date` (required if `defer_option` is `custom`): Date in YYYY-MM-DD format

#### `get_next_actions`
Get tasks available to work on now.
- `limit` (optional): Maximum tasks to return (default: 10)
- `exclude_tags` (optional): Array of tags to exclude

#### `add_tag_to_task`
Add a tag to an existing task.
- `task_name` (required): Name of task
- `tag_name` (required): Tag to add

#### `remove_tag_from_task`
Remove a tag from an existing task.
- `task_name` (required): Name of task
- `tag_name` (required): Tag to remove

#### `bulk_complete_tasks`
Mark multiple tasks as completed.
- `task_names` (required): Array of task names to complete

## Development

### Running the Server
```bash
npm start
```

### Debug Mode
```bash
npm run dev
```

### Testing
The server communicates via stdio, so you can test it with any MCP-compatible client or by running it directly and sending JSON-RPC messages.

## Technical Details

- **Protocol**: Model Context Protocol (MCP)
- **Transport**: stdio
- **AppleScript Integration**: Direct AppleScript execution via `osascript`
- **Error Handling**: Comprehensive error catching and user-friendly messages
- **Data Format**: Structured text responses with pipe-separated values

## Troubleshooting

### Common Issues

**"Things 3 not found"**
- Ensure Things 3 is installed and running
- Check that the app name matches exactly (case-sensitive)

**"Permission denied"**
- Grant Accessibility permissions in System Preferences
- Ensure Terminal/your MCP client has permission to control other applications

**"Task not found"**
- Task names must match exactly (case-sensitive)
- Use `search_tasks` to find the correct task name

**"AppleScript error"**
- Verify Things 3 is not in a modal dialog state
- Try closing and reopening Things 3

## Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

## License

MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with the [Model Context Protocol SDK](https://github.com/modelcontextprotocol/sdk)
- Integrates with [Things 3](https://culturedcode.com/things/) by Cultured Code
- Uses AppleScript for seamless macOS integration 