# mintask

A minimal task tracker for execution. No dashboards, no noise.

## What it does

- Create, edit, complete, and delete main tasks
- Nest sub-tasks under any main task
- Reorder sub-tasks by dragging
- Progress is calculated as completed sub-tasks ÷ total sub-tasks
- Tasks without sub-tasks work as ordinary checklists

Tasks are saved in your browser (`localStorage`). Nothing leaves this device.

## Develop

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Press `n` to add a task.
