import { Router } from "express";
import {
    listTaskLists,
    createTaskList,
    getTaskList,
    updateTaskList,
    deleteTaskList,
    listTasks,
    createTask,
    getTask,
    updateTask,
    deleteTask,
    toggleTask,
    moveTask,
    clearCompletedTasks,
    createTaskListWithTasks,
} from "./controller";

const router = Router();


// ─── Task List Routes ────────────────────────────────────────────────
router.get("/tasklists", listTaskLists);
router.post("/tasklists", createTaskList);
router.get("/tasklists/:taskListId", getTaskList);
router.patch("/tasklists/:taskListId", updateTaskList);
router.delete("/tasklists/:taskListId", deleteTaskList);


// ─── Task Routes ─────────────────────────────────────────────────────
router.get("/tasklists/:taskListId/tasks", listTasks);
router.post("/tasklists/:taskListId/tasks", createTask);
router.get("/tasklists/:taskListId/tasks/:taskId", getTask);
router.patch("/tasklists/:taskListId/tasks/:taskId", updateTask);
router.delete("/tasklists/:taskListId/tasks/:taskId", deleteTask);


// ─── Special Operations ─────────────────────────────────────────────
router.patch("/tasklists/:taskListId/tasks/:taskId/toggle", toggleTask);
router.post("/tasklists/:taskListId/tasks/:taskId/move", moveTask);
router.post("/tasklists/:taskListId/clear", clearCompletedTasks);


// ─── Combined ────────────────────────────────────────────────────────
router.post("/tasklists-with-tasks", createTaskListWithTasks);


export default router;
