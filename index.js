#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { execSync } from "child_process";

class Things3MCPServer {
  constructor() {
    this.server = new Server(
      {
        name: "things3-mcp-server",
        version: "0.1.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "add_task",
            description: "Add a new task to Things 3",
            inputSchema: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                  description: "Task name",
                },
                notes: {
                  type: "string",
                  description: "Task notes",
                },
                project: {
                  type: "string",
                  description: "Project name (optional)",
                },
                area: {
                  type: "string",
                  description: "Area name (optional)",
                },
                due_date: {
                  type: "string",
                  description: "Due date in YYYY-MM-DD format (optional)",
                },
                tags: {
                  type: "array",
                  items: { type: "string" },
                  description: "Array of tag names (optional)",
                },
              },
              required: ["name"],
            },
          },
          {
            name: "list_tasks",
            description: "List tasks from Things 3",
            inputSchema: {
              type: "object",
              properties: {
                list_type: {
                  type: "string",
                  enum: ["inbox", "today", "upcoming", "anytime", "someday", "completed"],
                  description: "Which list to query",
                  default: "today",
                },
                project: {
                  type: "string",
                  description: "Filter by project name (optional)",
                },
                area: {
                  type: "string", 
                  description: "Filter by area name (optional)",
                },
              },
            },
          },
          {
            name: "complete_task",
            description: "Mark a task as completed",
            inputSchema: {
              type: "object",
              properties: {
                task_name: {
                  type: "string",
                  description: "Name of the task to complete",
                },
              },
              required: ["task_name"],
            },
          },
          {
            name: "list_projects",
            description: "List all projects and areas",
            inputSchema: {
              type: "object",
              properties: {},
            },
          },
          {
            name: "search_tasks",
            description: "Search for tasks by name or content",
            inputSchema: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "Search query",
                },
              },
              required: ["query"],
            },
          },
          {
            name: "update_task",
            description: "Update an existing task's properties",
            inputSchema: {
              type: "object",
              properties: {
                task_name: {
                  type: "string",
                  description: "Current name of the task to update",
                },
                new_name: {
                  type: "string",
                  description: "New task name (optional)",
                },
                notes: {
                  type: "string",
                  description: "New task notes (optional)",
                },
                due_date: {
                  type: "string",
                  description: "New due date in YYYY-MM-DD format (optional)",
                },
                project: {
                  type: "string",
                  description: "Move to project name (optional)",
                },
                area: {
                  type: "string",
                  description: "Move to area name (optional)",
                },
              },
              required: ["task_name"],
            },
          },
          {
            name: "delete_task",
            description: "Delete a task permanently",
            inputSchema: {
              type: "object",
              properties: {
                task_name: {
                  type: "string",
                  description: "Name of the task to delete",
                },
              },
              required: ["task_name"],
            },
          },
          {
            name: "list_tasks_by_tag",
            description: "List tasks filtered by tag",
            inputSchema: {
              type: "object",
              properties: {
                tag_name: {
                  type: "string",
                  description: "Tag name to filter by",
                },
                list_type: {
                  type: "string",
                  enum: ["inbox", "today", "upcoming", "anytime", "someday", "all"],
                  description: "Which list to query (default: all)",
                  default: "all",
                },
              },
              required: ["tag_name"],
            },
          },
          {
            name: "get_overdue_tasks",
            description: "Get all overdue tasks",
            inputSchema: {
              type: "object",
              properties: {
                include_no_due_date: {
                  type: "boolean",
                  description: "Include tasks with no due date (default: false)",
                  default: false,
                },
              },
            },
          },
          {
            name: "create_project",
            description: "Create a new project",
            inputSchema: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                  description: "Project name",
                },
                area: {
                  type: "string",
                  description: "Area to place project in (optional)",
                },
                notes: {
                  type: "string",
                  description: "Project notes (optional)",
                },
              },
              required: ["name"],
            },
          },
          {
            name: "list_tags",
            description: "List all existing tags with usage counts",
            inputSchema: {
              type: "object",
              properties: {},
            },
          },
          {
            name: "defer_task",
            description: "Reschedule a task for later",
            inputSchema: {
              type: "object",
              properties: {
                task_name: {
                  type: "string",
                  description: "Name of the task to defer",
                },
                defer_option: {
                  type: "string",
                  enum: ["tomorrow", "next_week", "weekend", "custom"],
                  description: "When to reschedule the task",
                },
                custom_date: {
                  type: "string",
                  description: "Custom date in YYYY-MM-DD format (required if defer_option is 'custom')",
                },
              },
              required: ["task_name", "defer_option"],
            },
          },
          {
            name: "get_next_actions",
            description: "Get tasks that can be worked on now (no blocking start dates)",
            inputSchema: {
              type: "object",
              properties: {
                limit: {
                  type: "number",
                  description: "Maximum number of tasks to return (default: 10)",
                  default: 10,
                },
                exclude_tags: {
                  type: "array",
                  items: { type: "string" },
                  description: "Tags to exclude from results (optional)",
                },
              },
            },
          },
          {
            name: "add_tag_to_task",
            description: "Add a tag to an existing task",
            inputSchema: {
              type: "object",
              properties: {
                task_name: {
                  type: "string",
                  description: "Name of the task",
                },
                tag_name: {
                  type: "string",
                  description: "Tag to add",
                },
              },
              required: ["task_name", "tag_name"],
            },
          },
          {
            name: "remove_tag_from_task",
            description: "Remove a tag from an existing task",
            inputSchema: {
              type: "object",
              properties: {
                task_name: {
                  type: "string",
                  description: "Name of the task",
                },
                tag_name: {
                  type: "string",
                  description: "Tag to remove",
                },
              },
              required: ["task_name", "tag_name"],
            },
          },
          {
            name: "bulk_complete_tasks",
            description: "Mark multiple tasks as completed",
            inputSchema: {
              type: "object",
              properties: {
                task_names: {
                  type: "array",
                  items: { type: "string" },
                  description: "Array of task names to complete",
                },
              },
              required: ["task_names"],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "add_task":
            return await this.addTask(args);
          case "list_tasks":
            return await this.listTasks(args);
          case "complete_task":
            return await this.completeTask(args);
          case "list_projects":
            return await this.listProjects();
          case "search_tasks":
            return await this.searchTasks(args);
          case "update_task":
            return await this.updateTask(args);
          case "delete_task":
            return await this.deleteTask(args);
          case "list_tasks_by_tag":
            return await this.listTasksByTag(args);
          case "get_overdue_tasks":
            return await this.getOverdueTasks(args);
          case "create_project":
            return await this.createProject(args);
          case "list_tags":
            return await this.listTags();
          case "defer_task":
            return await this.deferTask(args);
          case "get_next_actions":
            return await this.getNextActions(args);
          case "add_tag_to_task":
            return await this.addTagToTask(args);
          case "remove_tag_from_task":
            return await this.removeTagFromTask(args);
          case "bulk_complete_tasks":
            return await this.bulkCompleteTasks(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error.message}`,
            },
          ],
        };
      }
    });
  }

  async addTask(args) {
    const { name, notes, project, area, due_date, tags } = args;
    
    let script = `
      tell application "Things3"
        set newToDo to make new to do with properties {name:"${name.replace(/"/g, '\\"')}"`;
    
    if (notes) {
      script += `, notes:"${notes.replace(/"/g, '\\"')}"`;
    }
    
    script += `}`;
    
    // Add to project or area if specified
    if (project) {
      script += `
        set targetProject to first project whose name is "${project.replace(/"/g, '\\"')}"
        move newToDo to targetProject`;
    } else if (area) {
      script += `
        set targetArea to first area whose name is "${area.replace(/"/g, '\\"')}"
        move newToDo to targetArea`;
    }
    
    // Set due date if specified
    if (due_date) {
      script += `
        set due date of newToDo to date "${due_date}"`;
    }
    
    // Add tags if specified
    if (tags && tags.length > 0) {
      for (const tag of tags) {
        script += `
        set tag names of newToDo to (tag names of newToDo) & "${tag.replace(/"/g, '\\"')}"`;
      }
    }
    
    script += `
      end tell`;

    try {
      execSync(`osascript -e '${script}'`);
      return {
        content: [
          {
            type: "text",
            text: `Successfully added task: "${name}"`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to add task: ${error.message}`);
    }
  }

  async listTasks(args) {
    const { list_type = "today", project, area } = args;
    
    let script = `
      tell application "Things3"
        set taskList to {}`;
    
    // Determine which list to query
    switch (list_type) {
      case "inbox":
        script += `
        set theTasks to to dos of list "Inbox"`;
        break;
      case "today":
        script += `
        set theTasks to to dos of list "Today"`;
        break;
      case "upcoming":
        script += `
        set theTasks to to dos of list "Upcoming"`;
        break;
      case "anytime":
        script += `
        set theTasks to to dos of list "Anytime"`;
        break;
      case "someday":
        script += `
        set theTasks to to dos of list "Someday"`;
        break;
      case "completed":
        script += `
        set theTasks to completed to dos`;
        break;
    }
    
    // Filter by project or area if specified
    if (project) {
      script += `
        set filteredTasks to {}
        repeat with aToDo in theTasks
          if project of aToDo is not missing value then
            if name of project of aToDo is "${project.replace(/"/g, '\\"')}" then
              set end of filteredTasks to aToDo
            end if
          end if
        end repeat
        set theTasks to filteredTasks`;
    } else if (area) {
      script += `
        set filteredTasks to {}
        repeat with aToDo in theTasks
          if area of aToDo is not missing value then
            if name of area of aToDo is "${area.replace(/"/g, '\\"')}" then
              set end of filteredTasks to aToDo
            end if
          end if
        end repeat
        set theTasks to filteredTasks`;
    }
    
    script += `
        repeat with aToDo in theTasks
          set taskName to name of aToDo
          set taskNotes to notes of aToDo
          set taskStatus to status of aToDo
          set taskProject to ""
          set taskArea to ""
          set taskDueDate to ""
          
          if project of aToDo is not missing value then
            set taskProject to name of project of aToDo
          end if
          
          if area of aToDo is not missing value then
            set taskArea to name of area of aToDo
          end if
          
          if due date of aToDo is not missing value then
            set taskDueDate to due date of aToDo as string
          end if
          
          set taskInfo to "Name: " & taskName & " | Status: " & taskStatus
          if taskProject is not "" then
            set taskInfo to taskInfo & " | Project: " & taskProject
          end if
          if taskArea is not "" then
            set taskInfo to taskInfo & " | Area: " & taskArea
          end if
          if taskDueDate is not "" then
            set taskInfo to taskInfo & " | Due: " & taskDueDate
          end if
          if taskNotes is not "" then
            set taskInfo to taskInfo & " | Notes: " & taskNotes
          end if
          
          set end of taskList to taskInfo
        end repeat
        
        return taskList as string
      end tell`;

    try {
      const result = execSync(`osascript -e '${script}'`, { encoding: 'utf8' });
      return {
        content: [
          {
            type: "text",
            text: result.trim() || `No tasks found in ${list_type} list`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to list tasks: ${error.message}`);
    }
  }

  async completeTask(args) {
    const { task_name } = args;
    
    const script = `
      tell application "Things3"
        set foundTask to first to do whose name is "${task_name.replace(/"/g, '\\"')}"
        set status of foundTask to completed
        return "Task completed: " & name of foundTask
      end tell`;

    try {
      const result = execSync(`osascript -e '${script}'`, { encoding: 'utf8' });
      return {
        content: [
          {
            type: "text",
            text: result.trim(),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to complete task: ${error.message}`);
    }
  }

  async listProjects() {
    const script = `
      tell application "Things3"
        set projectList to {}
        set areaList to {}
        
        repeat with aProject in projects
          set end of projectList to name of aProject
        end repeat
        
        repeat with anArea in areas
          set end of areaList to name of anArea
        end repeat
        
        set result to "PROJECTS:\\n"
        repeat with projectName in projectList
          set result to result & "- " & projectName & "\\n"
        end repeat
        
        set result to result & "\\nAREAS:\\n"
        repeat with areaName in areaList
          set result to result & "- " & areaName & "\\n"
        end repeat
        
        return result
      end tell`;

    try {
      const result = execSync(`osascript -e '${script}'`, { encoding: 'utf8' });
      return {
        content: [
          {
            type: "text",
            text: result.trim(),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to list projects: ${error.message}`);
    }
  }

  async searchTasks(args) {
    const { query } = args;
    
    const script = `
      tell application "Things3"
        set searchResults to {}
        set allTasks to to dos
        
        repeat with aToDo in allTasks
          set taskName to name of aToDo
          set taskNotes to notes of aToDo
          
          if taskName contains "${query.replace(/"/g, '\\"')}" or taskNotes contains "${query.replace(/"/g, '\\"')}" then
            set taskInfo to "Name: " & taskName
            if taskNotes is not "" then
              set taskInfo to taskInfo & " | Notes: " & taskNotes
            end if
            set end of searchResults to taskInfo
          end if
        end repeat
        
        return searchResults as string
      end tell`;

    try {
      const result = execSync(`osascript -e '${script}'`, { encoding: 'utf8' });
      return {
        content: [
          {
            type: "text",
            text: result.trim() || `No tasks found matching: ${query}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to search tasks: ${error.message}`);
    }
  }

  async updateTask(args) {
    const { task_name, new_name, notes, due_date, project, area } = args;
    
    let script = `
      tell application "Things3"
        set foundTask to first to do whose name is "${task_name.replace(/"/g, '\\"')}"`;
    
    if (new_name) {
      script += `
        set name of foundTask to "${new_name.replace(/"/g, '\\"')}"`;
    }
    
    if (notes !== undefined) {
      script += `
        set notes of foundTask to "${notes.replace(/"/g, '\\"')}"`;
    }
    
    if (due_date) {
      script += `
        set due date of foundTask to date "${due_date}"`;
    }
    
    // Move to project or area if specified
    if (project) {
      script += `
        set targetProject to first project whose name is "${project.replace(/"/g, '\\"')}"
        move foundTask to targetProject`;
    } else if (area) {
      script += `
        set targetArea to first area whose name is "${area.replace(/"/g, '\\"')}"
        move foundTask to targetArea`;
    }
    
    script += `
        return "Task updated: " & name of foundTask
      end tell`;

    try {
      const result = execSync(`osascript -e '${script}'`, { encoding: 'utf8' });
      return {
        content: [
          {
            type: "text",
            text: result.trim(),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to update task: ${error.message}`);
    }
  }

  async deleteTask(args) {
    const { task_name } = args;
    
    const script = `
      tell application "Things3"
        set foundTask to first to do whose name is "${task_name.replace(/"/g, '\\"')}"
        delete foundTask
        return "Task deleted: ${task_name.replace(/"/g, '\\"')}"
      end tell`;

    try {
      const result = execSync(`osascript -e '${script}'`, { encoding: 'utf8' });
      return {
        content: [
          {
            type: "text",
            text: result.trim(),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to delete task: ${error.message}`);
    }
  }

  async listTasksByTag(args) {
    const { tag_name, list_type = "all" } = args;
    
    let script = `
      tell application "Things3"
        set taskList to {}`;
    
    // Determine which tasks to search
    if (list_type === "all") {
      script += `
        set theTasks to to dos`;
    } else {
      switch (list_type) {
        case "inbox":
          script += `
        set theTasks to to dos of list "Inbox"`;
          break;
        case "today":
          script += `
        set theTasks to to dos of list "Today"`;
          break;
        case "upcoming":
          script += `
        set theTasks to to dos of list "Upcoming"`;
          break;
        case "anytime":
          script += `
        set theTasks to to dos of list "Anytime"`;
          break;
        case "someday":
          script += `
        set theTasks to to dos of list "Someday"`;
          break;
      }
    }
    
    script += `
        repeat with aToDo in theTasks
          set taskTags to tag names of aToDo
          repeat with aTag in taskTags
            if aTag is "${tag_name.replace(/"/g, '\\"')}" then
              set taskName to name of aToDo
              set taskNotes to notes of aToDo
              set taskStatus to status of aToDo
              set taskProject to ""
              set taskArea to ""
              
              if project of aToDo is not missing value then
                set taskProject to name of project of aToDo
              end if
              
              if area of aToDo is not missing value then
                set taskArea to name of area of aToDo
              end if
              
              set taskInfo to "Name: " & taskName & " | Status: " & taskStatus
              if taskProject is not "" then
                set taskInfo to taskInfo & " | Project: " & taskProject
              end if
              if taskArea is not "" then
                set taskInfo to taskInfo & " | Area: " & taskArea
              end if
              if taskNotes is not "" then
                set taskInfo to taskInfo & " | Notes: " & taskNotes
              end if
              
              set end of taskList to taskInfo
              exit repeat
            end if
          end repeat
        end repeat
        
        return taskList as string
      end tell`;

    try {
      const result = execSync(`osascript -e '${script}'`, { encoding: 'utf8' });
      return {
        content: [
          {
            type: "text",
            text: result.trim() || `No tasks found with tag: ${tag_name}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to list tasks by tag: ${error.message}`);
    }
  }

  async getOverdueTasks(args) {
    const { include_no_due_date = false } = args;
    
    const script = `
      tell application "Things3"
        set overdueList to {}
        set allTasks to to dos
        set currentDate to current date
        
        repeat with aToDo in allTasks
          set taskDueDate to due date of aToDo
          set isOverdue to false
          
          if taskDueDate is not missing value then
            if taskDueDate < currentDate then
              set isOverdue to true
            end if
          else
            if ${include_no_due_date} then
              set isOverdue to true
            end if
          end if
          
          if isOverdue and status of aToDo is not completed then
            set taskName to name of aToDo
            set taskNotes to notes of aToDo
            set taskProject to ""
            set taskArea to ""
            
            if project of aToDo is not missing value then
              set taskProject to name of project of aToDo
            end if
            
            if area of aToDo is not missing value then
              set taskArea to name of area of aToDo
            end if
            
            set taskInfo to "Name: " & taskName
            if taskDueDate is not missing value then
              set taskInfo to taskInfo & " | Due: " & (taskDueDate as string)
            else
              set taskInfo to taskInfo & " | Due: No due date"
            end if
            if taskProject is not "" then
              set taskInfo to taskInfo & " | Project: " & taskProject
            end if
            if taskArea is not "" then
              set taskInfo to taskInfo & " | Area: " & taskArea
            end if
            if taskNotes is not "" then
              set taskInfo to taskInfo & " | Notes: " & taskNotes
            end if
            
            set end of overdueList to taskInfo
          end if
        end repeat
        
        return overdueList as string
      end tell`;

    try {
      const result = execSync(`osascript -e '${script}'`, { encoding: 'utf8' });
      return {
        content: [
          {
            type: "text",
            text: result.trim() || "No overdue tasks found",
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get overdue tasks: ${error.message}`);
    }
  }

  async createProject(args) {
    const { name, area, notes } = args;
    
    let script = `
      tell application "Things3"
        set newProject to make new project with properties {name:"${name.replace(/"/g, '\\"')}"`;
    
    if (notes) {
      script += `, notes:"${notes.replace(/"/g, '\\"')}"`;
    }
    
    script += `}`;
    
    // Add to area if specified
    if (area) {
      script += `
        set targetArea to first area whose name is "${area.replace(/"/g, '\\"')}"
        move newProject to targetArea`;
    }
    
    script += `
        return "Project created: " & name of newProject
      end tell`;

    try {
      const result = execSync(`osascript -e '${script}'`, { encoding: 'utf8' });
      return {
        content: [
          {
            type: "text",
            text: result.trim(),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to create project: ${error.message}`);
    }
  }

  async listTags() {
    const script = `
      tell application "Things3"
        set tagCounts to {}
        set allTags to {}
        set allTasks to to dos
        
        -- Collect all unique tags
        repeat with aToDo in allTasks
          set taskTags to tag names of aToDo
          repeat with aTag in taskTags
            if aTag is not in allTags then
              set end of allTags to aTag
            end if
          end repeat
        end repeat
        
        -- Count usage for each tag
        repeat with tagName in allTags
          set tagCount to 0
          repeat with aToDo in allTasks
            set taskTags to tag names of aToDo
            if tagName is in taskTags then
              set tagCount to tagCount + 1
            end if
          end repeat
          set end of tagCounts to tagName & " (" & tagCount & " tasks)"
        end repeat
        
        return tagCounts as string
      end tell`;

    try {
      const result = execSync(`osascript -e '${script}'`, { encoding: 'utf8' });
      return {
        content: [
          {
            type: "text",
            text: result.trim() || "No tags found",
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to list tags: ${error.message}`);
    }
  }

  async deferTask(args) {
    const { task_name, defer_option, custom_date } = args;
    
    let newDate;
    const script = `
      tell application "Things3"
        set foundTask to first to do whose name is "${task_name.replace(/"/g, '\\"')}"`;
    
    let deferScript;
    switch (defer_option) {
      case "tomorrow":
        deferScript = `
        set newDueDate to (current date) + (1 * days)
        set due date of foundTask to newDueDate`;
        break;
      case "next_week":
        deferScript = `
        set newDueDate to (current date) + (7 * days)
        set due date of foundTask to newDueDate`;
        break;
      case "weekend":
        deferScript = `
        set currentDate to current date
        set currentWeekday to weekday of currentDate
        set daysToSaturday to (7 - (currentWeekday as integer)) + 1
        if daysToSaturday ≤ 0 then set daysToSaturday to daysToSaturday + 7
        set newDueDate to currentDate + (daysToSaturday * days)
        set due date of foundTask to newDueDate`;
        break;
      case "custom":
        if (!custom_date) {
          throw new Error("custom_date is required when defer_option is 'custom'");
        }
        deferScript = `
        set due date of foundTask to date "${custom_date}"`;
        break;
    }
    
    const fullScript = script + deferScript + `
        return "Task deferred: " & name of foundTask & " | New due date: " & (due date of foundTask as string)
      end tell`;

    try {
      const result = execSync(`osascript -e '${fullScript}'`, { encoding: 'utf8' });
      return {
        content: [
          {
            type: "text",
            text: result.trim(),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to defer task: ${error.message}`);
    }
  }

  async getNextActions(args) {
    const { limit = 10, exclude_tags = [] } = args;
    
    let excludeCondition = "";
    if (exclude_tags.length > 0) {
      const excludeChecks = exclude_tags.map(tag => 
        `"${tag.replace(/"/g, '\\"')}" is not in taskTags`
      ).join(" and ");
      excludeCondition = ` and (${excludeChecks})`;
    }
    
    const script = `
      tell application "Things3"
        set nextActions to {}
        set taskCount to 0
        set allTasks to to dos
        set currentDate to current date
        
        repeat with aToDo in allTasks
          if taskCount ≥ ${limit} then exit repeat
          
          set taskStatus to status of aToDo
          set taskStartDate to start date of aToDo
          set taskTags to tag names of aToDo
          
          -- Check if task is available (not completed, no blocking start date)
          if taskStatus is not completed and (taskStartDate is missing value or taskStartDate ≤ currentDate)${excludeCondition} then
            set taskName to name of aToDo
            set taskNotes to notes of aToDo
            set taskProject to ""
            set taskArea to ""
            set taskDue to ""
            
            if project of aToDo is not missing value then
              set taskProject to name of project of aToDo
            end if
            
            if area of aToDo is not missing value then
              set taskArea to name of area of aToDo
            end if
            
            if due date of aToDo is not missing value then
              set taskDue to due date of aToDo as string
            end if
            
            set taskInfo to "Name: " & taskName
            if taskProject is not "" then
              set taskInfo to taskInfo & " | Project: " & taskProject
            end if
            if taskArea is not "" then
              set taskInfo to taskInfo & " | Area: " & taskArea
            end if
            if taskDue is not "" then
              set taskInfo to taskInfo & " | Due: " & taskDue
            end if
            if taskNotes is not "" then
              set taskInfo to taskInfo & " | Notes: " & taskNotes
            end if
            
            set end of nextActions to taskInfo
            set taskCount to taskCount + 1
          end if
        end repeat
        
        return nextActions as string
      end tell`;

    try {
      const result = execSync(`osascript -e '${script}'`, { encoding: 'utf8' });
      return {
        content: [
          {
            type: "text",
            text: result.trim() || "No available next actions found",
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get next actions: ${error.message}`);
    }
  }

  async addTagToTask(args) {
    const { task_name, tag_name } = args;
    
    const script = `
      tell application "Things3"
        set foundTask to first to do whose name is "${task_name.replace(/"/g, '\\"')}"
        set newTag to make new tag with properties {name:"${tag_name.replace(/"/g, '\\"')}"}
        set tag names of foundTask to (tag names of foundTask) & {"${tag_name.replace(/"/g, '\\"')}"}
        return "Tag added: " & "${tag_name.replace(/"/g, '\\"')}" & " to task: " & name of foundTask
      end tell`;

    try {
      const result = execSync(`osascript -e '${script}'`, { encoding: 'utf8' });
      return {
        content: [
          {
            type: "text",
            text: result.trim(),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to add tag to task: ${error.message}`);
    }
  }

  async removeTagFromTask(args) {
    const { task_name, tag_name } = args;
    
    const script = `
      tell application "Things3"
        set foundTask to first to do whose name is "${task_name.replace(/"/g, '\\"')}"
        set currentTags to tag names of foundTask
        set newTags to {}
        
        repeat with aTag in currentTags
          if aTag is not "${tag_name.replace(/"/g, '\\"')}" then
            set end of newTags to aTag
          end if
        end repeat
        
        set tag names of foundTask to newTags
        return "Tag removed: " & "${tag_name.replace(/"/g, '\\"')}" & " from task: " & name of foundTask
      end tell`;

    try {
      const result = execSync(`osascript -e '${script}'`, { encoding: 'utf8' });
      return {
        content: [
          {
            type: "text",
            text: result.trim(),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to remove tag from task: ${error.message}`);
    }
  }

  async bulkCompleteTasks(args) {
    const { task_names } = args;
    
    const taskList = task_names.map(name => `"${name.replace(/"/g, '\\"')}"`).join(", ");
    
    const script = `
      tell application "Things3"
        set taskNames to {${taskList}}
        set completedTasks to {}
        
        repeat with taskName in taskNames
          try
            set foundTask to first to do whose name is taskName
            set status of foundTask to completed
            set end of completedTasks to taskName
          on error
            -- Task not found, skip
          end try
        end repeat
        
        set completedCount to count of completedTasks
        return "Completed " & completedCount & " tasks: " & (completedTasks as string)
      end tell`;

    try {
      const result = execSync(`osascript -e '${script}'`, { encoding: 'utf8' });
      return {
        content: [
          {
            type: "text",
            text: result.trim(),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to bulk complete tasks: ${error.message}`);
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Things 3 MCP server running on stdio");
  }
}

const server = new Things3MCPServer();
server.run().catch(console.error);