import { Request, Response, NextFunction } from "express";
import { google } from "googleapis";
import ApiResponse from "../utils/response.util";
import { getAuthedClient } from "../google-auth/auth.service";


// ─── Helper ──────────────────────────────────────────────────────────
function getTasksApi() {
    return google.tasks({ version: "v1", auth: getAuthedClient() });
}


// ─── Task Lists ──────────────────────────────────────────────────────

/**
 * GET /tasklists
 */
export const listTaskLists = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tasksApi = getTasksApi();
        const { data } = await tasksApi.tasklists.list({ maxResults: 100 });
        ApiResponse(res, 200, "Task lists fetched", { taskLists: data.items || [] });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /tasklists
 */
export const createTaskList = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { title } = req.body;

        if (!title) {
            return ApiResponse(res, 400, "Title is required");
        }

        const tasksApi = getTasksApi();
        const { data } = await tasksApi.tasklists.insert({ requestBody: { title } });
        ApiResponse(res, 201, "Task list created", { taskList: data });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /tasklists/:taskListId
 */
export const getTaskList = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const taskListId = req.params.taskListId as string;
        const tasksApi = getTasksApi();
        const { data } = await tasksApi.tasklists.get({ tasklist: taskListId });
        ApiResponse(res, 200, "Task list fetched", { taskList: data });
    } catch (error) {
        next(error);
    }
};

/**
 * PATCH /tasklists/:taskListId
 */
export const updateTaskList = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const taskListId = req.params.taskListId as string;
        const { title } = req.body;

        if (!title) {
            return ApiResponse(res, 400, "Title is required");
        }

        const tasksApi = getTasksApi();
        const { data } = await tasksApi.tasklists.patch({
            tasklist: taskListId,
            requestBody: { title },
        });
        ApiResponse(res, 200, "Task list updated", { taskList: data });
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /tasklists/:taskListId
 */
export const deleteTaskList = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const taskListId = req.params.taskListId as string;
        const tasksApi = getTasksApi();
        await tasksApi.tasklists.delete({ tasklist: taskListId });
        ApiResponse(res, 200, "Task list deleted");
    } catch (error) {
        next(error);
    }
};


// ─── Tasks ───────────────────────────────────────────────────────────

/**
 * GET /tasklists/:taskListId/tasks
 */
export const listTasks = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const taskListId = req.params.taskListId as string;
        const showCompleted = req.query.showCompleted !== "false";
        const showHidden = req.query.showHidden === "true";

        const tasksApi = getTasksApi();
        const { data } = await tasksApi.tasks.list({
            tasklist: taskListId,
            maxResults: 100,
            showCompleted,
            showHidden,
        });
        ApiResponse(res, 200, "Tasks fetched", { tasks: data.items || [] });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /tasklists/:taskListId/tasks
 */
export const createTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const taskListId = req.params.taskListId as string;
        const { title, notes, due, status } = req.body;

        if (!title) {
            return ApiResponse(res, 400, "Title is required");
        }

        const tasksApi = getTasksApi();
        const { data } = await tasksApi.tasks.insert({
            tasklist: taskListId,
            requestBody: {
                title,
                ...(notes && { notes }),
                ...(due && { due }),
                ...(status && { status }),
            },
        });
        ApiResponse(res, 201, "Task created", { task: data });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /tasklists/:taskListId/tasks/:taskId
 */
export const getTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const taskListId = req.params.taskListId as string;
        const taskId = req.params.taskId as string;
        const tasksApi = getTasksApi();
        const { data } = await tasksApi.tasks.get({
            tasklist: taskListId,
            task: taskId,
        });
        ApiResponse(res, 200, "Task fetched", { task: data });
    } catch (error) {
        next(error);
    }
};

/**
 * PATCH /tasklists/:taskListId/tasks/:taskId
 */
export const updateTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const taskListId = req.params.taskListId as string;
        const taskId = req.params.taskId as string;
        const { title, notes, due, status } = req.body;

        const tasksApi = getTasksApi();
        const { data } = await tasksApi.tasks.patch({
            tasklist: taskListId,
            task: taskId,
            requestBody: {
                ...(title && { title }),
                ...(notes !== undefined && { notes }),
                ...(due !== undefined && { due }),
                ...(status && { status }),
            },
        });
        ApiResponse(res, 200, "Task updated", { task: data });
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /tasklists/:taskListId/tasks/:taskId
 */
export const deleteTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const taskListId = req.params.taskListId as string;
        const taskId = req.params.taskId as string;
        const tasksApi = getTasksApi();
        await tasksApi.tasks.delete({
            tasklist: taskListId,
            task: taskId,
        });
        ApiResponse(res, 200, "Task deleted");
    } catch (error) {
        next(error);
    }
};


// ─── Special Operations ──────────────────────────────────────────────

/**
 * PATCH /tasklists/:taskListId/tasks/:taskId/toggle
 * Toggles task between needsAction and completed.
 */
export const toggleTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const taskListId = req.params.taskListId as string;
        const taskId = req.params.taskId as string;
        const tasksApi = getTasksApi();

        // Fetch current state
        const { data: current } = await tasksApi.tasks.get({
            tasklist: taskListId,
            task: taskId,
        });

        const newStatus = current.status === "completed" ? "needsAction" : "completed";

        const { data } = await tasksApi.tasks.patch({
            tasklist: taskListId,
            task: taskId,
            requestBody: {
                status: newStatus,
                // Google requires clearing completed date when un-completing
                ...(newStatus === "needsAction" && { completed: null }),
            },
        });

        ApiResponse(res, 200, `Task marked as ${newStatus}`, { task: data });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /tasklists/:taskListId/tasks/:taskId/move
 * Moves/reorders a task within the list.
 */
export const moveTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const taskListId = req.params.taskListId as string;
        const taskId = req.params.taskId as string;
        const { parent, previous } = req.body;

        const tasksApi = getTasksApi();
        const { data } = await tasksApi.tasks.move({
            tasklist: taskListId,
            task: taskId,
            parent: parent || undefined,
            previous: previous || undefined,
        });
        ApiResponse(res, 200, "Task moved", { task: data });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /tasklists/:taskListId/clear
 * Clears all completed tasks from a task list.
 */
export const clearCompletedTasks = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const taskListId = req.params.taskListId as string;
        const tasksApi = getTasksApi();
        await tasksApi.tasks.clear({ tasklist: taskListId });
        ApiResponse(res, 200, "Completed tasks cleared");
    } catch (error) {
        next(error);
    }
};

/**
 * POST /tasklists-with-tasks
 * Creates a task list and populates it with tasks in one call.
 */
export const createTaskListWithTasks = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { title, tasks } = req.body;

        if (!title) {
            return ApiResponse(res, 400, "Title is required");
        }

        const tasksApi = getTasksApi();

        // Create the task list
        const { data: taskList } = await tasksApi.tasklists.insert({
            requestBody: { title },
        });

        // Create tasks inside it
        const createdTasks = [];
        if (Array.isArray(tasks) && tasks.length > 0) {
            for (const t of tasks) {
                const { data: task } = await tasksApi.tasks.insert({
                    tasklist: taskList.id!,
                    requestBody: {
                        title: t.title,
                        ...(t.notes && { notes: t.notes }),
                        ...(t.due && { due: t.due }),
                        ...(t.status && { status: t.status }),
                    },
                });
                createdTasks.push(task);
            }
        }

        ApiResponse(res, 201, "Task list created with tasks", {
            taskList,
            tasks: createdTasks,
        });
    } catch (error) {
        next(error);
    }
};
