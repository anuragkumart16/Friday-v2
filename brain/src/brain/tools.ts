import { tool } from "ai"
import { z } from "zod"
import { google } from "googleapis"
import { getAuthedClient, isAuthorized } from "../google-auth/auth.service"


// ─── Helper ──────────────────────────────────────────────────────────
function getTasksApi() {
    return google.tasks({ version: "v1", auth: getAuthedClient() });
}


// ─── Google Tasks Tools ──────────────────────────────────────────────

/**
 * Lists all Google Task lists for the authenticated user.
 *
 * Input: none
 *
 * Output:
 *   { taskLists: [{ id, title, updated, selfLink }] }
 *   or { error: string } if not authorized
 */
export const listTaskLists = tool({
    description: "List all Google Task lists (collections) for the user. Call this FIRST to get the real taskListId values before using any other tool. Input: none. Output: { taskLists: [{ id, title, updated }] }.",
    inputSchema: z.object({
        maxResults: z.number().optional().default(100).describe("Maximum number of task lists to return"),
    }),
    execute: async () => {
        if (!isAuthorized()) return { error: "Google account not connected. Please authorize first." };
        const tasksApi = getTasksApi();
        const { data } = await tasksApi.tasklists.list({ maxResults: 100 });
        return { taskLists: data.items || [] };
    },
});

/**
 * Creates a new Google Task list (collection).
 *
 * Input:
 *   { title: string } — name of the new task list
 *
 * Output:
 *   { taskList: { id, title, updated, selfLink } }
 *   or { error: string } if not authorized
 */
export const createTaskList = tool({
    description: "Create a new Google Task list (collection). Use when the user wants a new category or project. Input: { title: string }. Output: { taskList: { id, title, updated } }.",
    inputSchema: z.object({
        title: z.string().describe("The name of the new task list"),
    }),
    execute: async ({ title }) => {
        if (!isAuthorized()) return { error: "Google account not connected." };
        const tasksApi = getTasksApi();
        const { data } = await tasksApi.tasklists.insert({ requestBody: { title } });
        return { taskList: data };
    },
});

/**
 * Deletes a Google Task list by its ID.
 *
 * Input:
 *   { taskListId: string } — ID from listTaskLists response
 *
 * Output:
 *   { success: true, message: string }
 *   or { error: string } if not authorized
 */
export const deleteTaskList = tool({
    description: "Delete a Google Task list. Call listTaskLists first to get the real ID. Input: { taskListId: string }. Output: { success: true, message: string }.",
    inputSchema: z.object({
        taskListId: z.string().describe("The ID of the task list to delete"),
    }),
    execute: async ({ taskListId }) => {
        if (!isAuthorized()) return { error: "Google account not connected." };
        const tasksApi = getTasksApi();
        await tasksApi.tasklists.delete({ tasklist: taskListId });
        return { success: true, message: "Task list deleted" };
    },
});

/**
 * Lists all tasks in a specific Google Task list.
 *
 * Input:
 *   { taskListId: string, showCompleted?: boolean }
 *
 * Output:
 *   { tasks: [{ id, title, notes, status, due, completed, updated }] }
 *   or { error: string } if not authorized
 */
export const listTasks = tool({
    description: "List all tasks in a specific Google Task list. Call listTaskLists first to get the real taskListId. Input: { taskListId: string, showCompleted?: boolean }. Output: { tasks: [{ id, title, notes, status ('needsAction'|'completed'), due, updated }] }.",
    inputSchema: z.object({
        taskListId: z.string().describe("The ID of the task list to get tasks from"),
        showCompleted: z.boolean().optional().default(true).describe("Whether to include completed tasks"),
    }),
    execute: async ({ taskListId, showCompleted }) => {
        if (!isAuthorized()) return { error: "Google account not connected." };
        const tasksApi = getTasksApi();
        const { data } = await tasksApi.tasks.list({
            tasklist: taskListId,
            maxResults: 100,
            showCompleted,
        });
        return { tasks: data.items || [] };
    },
});

/**
 * Creates a new task in a Google Task list.
 *
 * Input:
 *   { taskListId: string, title: string, notes?: string, due?: string (ISO 8601) }
 *
 * Output:
 *   { task: { id, title, notes, status, due, updated } }
 *   or { error: string } if not authorized
 */
export const createTask = tool({
    description: "Create a new task in a Google Task list. Call listTaskLists first to get the taskListId. Input: { taskListId: string, title: string, notes?: string, due?: string (ISO 8601) }. Output: { task: { id, title, notes, status, due, updated } }.",
    inputSchema: z.object({
        taskListId: z.string().describe("The ID of the task list to add the task to"),
        title: z.string().describe("The title/heading of the task"),
        notes: z.string().optional().describe("Additional notes or description for the task"),
        due: z.string().optional().describe("Due date in ISO 8601 format (e.g. 2026-03-20T00:00:00.000Z)"),
    }),
    execute: async ({ taskListId, title, notes, due }) => {
        if (!isAuthorized()) return { error: "Google account not connected." };
        const tasksApi = getTasksApi();
        const { data } = await tasksApi.tasks.insert({
            tasklist: taskListId,
            requestBody: {
                title,
                ...(notes && { notes }),
                ...(due && { due }),
            },
        });
        return { task: data };
    },
});

/**
 * Updates an existing task's title, notes, due date, or status.
 *
 * Input:
 *   { taskListId: string, taskId: string, title?: string, notes?: string,
 *     due?: string (ISO 8601), status?: 'needsAction' | 'completed' }
 *
 * Output:
 *   { task: { id, title, notes, status, due, completed, updated } }
 *   or { error: string } if not authorized
 */
export const updateTask = tool({
    description: "Update an existing task. Call listTaskLists then listTasks first to get real IDs. Input: { taskListId: string, taskId: string, title?: string, notes?: string, due?: string (ISO 8601), status?: 'needsAction'|'completed' }. Output: { task: { id, title, notes, status, due, updated } }.",
    inputSchema: z.object({
        taskListId: z.string().describe("The ID of the task list containing the task"),
        taskId: z.string().describe("The ID of the task to update"),
        title: z.string().optional().describe("New title for the task"),
        notes: z.string().optional().describe("New notes for the task"),
        due: z.string().optional().describe("New due date in ISO 8601 format"),
        status: z.enum(["needsAction", "completed"]).optional().describe("Set task status: 'needsAction' or 'completed'"),
    }),
    execute: async ({ taskListId, taskId, title, notes, due, status }) => {
        if (!isAuthorized()) return { error: "Google account not connected." };
        const tasksApi = getTasksApi();
        const { data } = await tasksApi.tasks.patch({
            tasklist: taskListId,
            task: taskId,
            requestBody: {
                ...(title && { title }),
                ...(notes !== undefined && { notes }),
                ...(due !== undefined && { due }),
                ...(status && { status }),
                ...(status === "needsAction" && { completed: null }),
            },
        });
        return { task: data };
    },
});

/**
 * Deletes a task from a Google Task list.
 *
 * Input:
 *   { taskListId: string, taskId: string }
 *
 * Output:
 *   { success: true, message: string }
 *   or { error: string } if not authorized
 */
export const deleteTask = tool({
    description: "Delete a task. Call listTaskLists then listTasks first to get real IDs. Input: { taskListId: string, taskId: string }. Output: { success: true, message: string }.",
    inputSchema: z.object({
        taskListId: z.string().describe("The ID of the task list containing the task"),
        taskId: z.string().describe("The ID of the task to delete"),
    }),
    execute: async ({ taskListId, taskId }) => {
        if (!isAuthorized()) return { error: "Google account not connected." };
        const tasksApi = getTasksApi();
        await tasksApi.tasks.delete({ tasklist: taskListId, task: taskId });
        return { success: true, message: "Task deleted" };
    },
});

/**
 * Toggles a task between completed and needsAction status.
 *
 * Input:
 *   { taskListId: string, taskId: string }
 *
 * Output:
 *   { task: { id, title, status, completed, updated }, message: string }
 *   or { error: string } if not authorized
 */
export const toggleTaskCompletion = tool({
    description: "Toggle a task between completed and needsAction. Call listTaskLists then listTasks first to get real IDs. Input: { taskListId: string, taskId: string }. Output: { task: { id, title, status, updated }, message: string }.",
    inputSchema: z.object({
        taskListId: z.string().describe("The ID of the task list containing the task"),
        taskId: z.string().describe("The ID of the task to toggle"),
    }),
    execute: async ({ taskListId, taskId }) => {
        if (!isAuthorized()) return { error: "Google account not connected." };
        const tasksApi = getTasksApi();
        const { data: current } = await tasksApi.tasks.get({ tasklist: taskListId, task: taskId });
        const newStatus = current.status === "completed" ? "needsAction" : "completed";
        const { data } = await tasksApi.tasks.patch({
            tasklist: taskListId,
            task: taskId,
            requestBody: {
                status: newStatus,
                ...(newStatus === "needsAction" && { completed: null }),
            },
        });
        return { task: data, message: `Task marked as ${newStatus}` };
    },
});

/**
 * Clears all completed tasks from a Google Task list.
 *
 * Input:
 *   { taskListId: string }
 *
 * Output:
 *   { success: true, message: string }
 *   or { error: string } if not authorized
 */
export const clearCompletedTasks = tool({
    description: "Clear all completed tasks from a Google Task list. Call listTaskLists first to get the real taskListId. Input: { taskListId: string }. Output: { success: true, message: string }.",
    inputSchema: z.object({
        taskListId: z.string().describe("The ID of the task list to clear completed tasks from"),
    }),
    execute: async ({ taskListId }) => {
        if (!isAuthorized()) return { error: "Google account not connected." };
        const tasksApi = getTasksApi();
        await tasksApi.tasks.clear({ tasklist: taskListId });
        return { success: true, message: "Completed tasks cleared" };
    },
});


// ─── Composite Tools (handle multi-step logic internally) ────────────

/**
 * Gets ALL tasks across ALL task lists in one call.
 * No need to call listTaskLists first — this does it internally.
 *
 * Input:
 *   { showCompleted?: boolean }
 *
 * Output:
 *   { results: [{ taskListId, taskListTitle, tasks: [{ id, title, notes, status, due }] }] }
 */
export const getAllTasks = tool({
    description: "Get all tasks across all task lists in one call. Use this when the user asks about their tasks, TODOs, or pending items. No IDs needed — this fetches everything automatically. Input: { showCompleted?: boolean }. Output: { results: [{ taskListId, taskListTitle, tasks: [{ id, title, notes, status, due }] }] }.",
    inputSchema: z.object({
        showCompleted: z.boolean().optional().default(true).describe("Whether to include completed tasks"),
    }),
    execute: async ({ showCompleted }) => {
        if (!isAuthorized()) return { error: "Google account not connected. Please authorize first." };
        const tasksApi = getTasksApi();
        const { data: listsData } = await tasksApi.tasklists.list({ maxResults: 100 });
        const taskLists = listsData.items || [];

        const results = await Promise.all(
            taskLists.map(async (list) => {
                const { data } = await tasksApi.tasks.list({
                    tasklist: list.id!,
                    maxResults: 100,
                    showCompleted,
                });
                return {
                    taskListId: list.id,
                    taskListTitle: list.title,
                    tasks: (data.items || []).map(t => ({
                        id: t.id,
                        title: t.title,
                        notes: t.notes,
                        status: t.status,
                        due: t.due,
                    })),
                };
            })
        );
        return { results };
    },
});

/**
 * Creates a task in the first (default) task list without needing a taskListId.
 *
 * Input:
 *   { title: string, notes?: string, due?: string (ISO 8601), taskListTitle?: string }
 *
 * Output:
 *   { task: { id, title, notes, status, due }, taskListTitle: string }
 */
export const addTask = tool({
    description: "Create a task without needing a taskListId. If taskListTitle is provided, it finds the matching list; otherwise uses the default (first) list. Input: { title: string, notes?: string, due?: string (ISO 8601), taskListTitle?: string }. Output: { task: { id, title, notes, status, due }, taskListTitle: string }.",
    inputSchema: z.object({
        title: z.string().describe("The title of the task"),
        notes: z.string().optional().describe("Additional notes or description"),
        due: z.string().optional().describe("Due date in ISO 8601 format (e.g. 2026-03-20T00:00:00.000Z)"),
        taskListTitle: z.string().optional().describe("Name of the task list to add to. If not provided, uses the default list."),
    }),
    execute: async ({ title, notes, due, taskListTitle }) => {
        if (!isAuthorized()) return { error: "Google account not connected." };
        const tasksApi = getTasksApi();
        const { data: listsData } = await tasksApi.tasklists.list({ maxResults: 100 });
        const taskLists = listsData.items || [];

        if (taskLists.length === 0) return { error: "No task lists found. Create one first." };

        let targetList = taskLists[0];
        if (taskListTitle) {
            const match = taskLists.find(l => l.title?.toLowerCase() === taskListTitle.toLowerCase());
            if (match) targetList = match;
        }

        const { data } = await tasksApi.tasks.insert({
            tasklist: targetList.id!,
            requestBody: {
                title,
                ...(notes && { notes }),
                ...(due && { due }),
            },
        });
        return { task: data, taskListTitle: targetList.title };
    },
});

/**
 * Marks a task as completed by searching for it by title.
 *
 * Input:
 *   { title: string }
 *
 * Output:
 *   { task: { id, title, status }, message: string }
 */
export const completeTaskByTitle = tool({
    description: "Mark a task as completed by searching for it by title. No IDs needed — finds the task automatically. Input: { title: string }. Output: { task: { id, title, status }, message: string } or { error: string } if not found.",
    inputSchema: z.object({
        title: z.string().describe("The title (or partial title) of the task to mark as completed"),
    }),
    execute: async ({ title }) => {
        if (!isAuthorized()) return { error: "Google account not connected." };
        const tasksApi = getTasksApi();
        const { data: listsData } = await tasksApi.tasklists.list({ maxResults: 100 });
        const taskLists = listsData.items || [];

        for (const list of taskLists) {
            const { data } = await tasksApi.tasks.list({ tasklist: list.id!, maxResults: 100 });
            const match = (data.items || []).find(
                t => t.title?.toLowerCase().includes(title.toLowerCase()) && t.status !== "completed"
            );
            if (match) {
                const { data: updated } = await tasksApi.tasks.patch({
                    tasklist: list.id!,
                    task: match.id!,
                    requestBody: { status: "completed" },
                });
                return { task: updated, message: `Task "${match.title}" marked as completed` };
            }
        }
        return { error: `No pending task found matching "${title}"` };
    },
});


// ─── Tools Export ────────────────────────────────────────────────────

export const googleTasksTools = {
    getAllTasks,
    addTask,
    completeTaskByTitle,
    listTaskLists,
    createTaskList,
    deleteTaskList,
    listTasks,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskCompletion,
    clearCompletedTasks,
};
