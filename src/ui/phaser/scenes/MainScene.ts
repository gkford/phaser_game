import Phaser from "phaser";
import { createInitialGameState, tickGame, reassignWorker, startResearch, toggleTaskFocus } from "../../../core/game/state";
import { GameState, TaskState, Task } from "../../../types";

export default class MainScene extends Phaser.Scene {
  gameState: GameState;
  resourceText!: Phaser.GameObjects.Text;
  taskTexts: Record<string, Phaser.GameObjects.Text> = {};
  buttons: Record<string, Phaser.GameObjects.Text> = {};
  taskPositions: Record<string, number> = {};
  productionTexts: Record<string, Phaser.GameObjects.Text> = {};

  constructor() {
    super("MainScene");
    this.gameState = createInitialGameState();
  }

  preload() {
    // Load assets here if needed (e.g., background images, icons)
  }

  create() {
    this.createUI();
    this.time.addEvent({ delay: 1000, callback: this.updateGame, callbackScope: this, loop: true });
  }

  createUI() {
    this.add.text(20, 20, "Prehistoric Tech Game", { fontSize: "24px", color: "#fff" });

    // Resource Display
    this.resourceText = this.add.text(20, 60, this.getResourceText(), { fontSize: "18px", color: "#fff" });

    // Create Task Cards
    let yOffset = 150;
    Object.entries(this.gameState.tasks).forEach(([taskId, task]) => {
      const taskPositionY = yOffset;
      this.taskPositions[taskId] = taskPositionY;
      
      // Create background rectangle for card
      this.add.rectangle(20, yOffset, 600, 105, 0x333333)
        .setOrigin(0, 0)
        .setAlpha(0.5);

      // Add task info text
      this.taskTexts[taskId] = this.add.text(35, yOffset + 15, this.getTaskText(taskId), 
        { fontSize: "16px", color: "#fff" });

      // Add Buttons on a new line
      if (task.state === TaskState.Discovered) {
        this.buttons[`${taskId}-minus`] = this.add
          .text(35, yOffset + 55, "[-]", { fontSize: "16px", color: "#f00" })
          .setInteractive()
          .on("pointerdown", () => this.handleReassign(taskId, "remove"));

        this.buttons[`${taskId}-plus`] = this.add
          .text(75, yOffset + 55, "[+]", { fontSize: "16px", color: "#0f0" })
          .setInteractive()
          .on("pointerdown", () => this.handleReassign(taskId, "add"));

        // Create production text, to the right of the + button:
        this.productionTexts[taskId] = this.add.text(
          120, 
          yOffset + 55, 
          this.getProductionText(taskId), 
          { fontSize: "16px", color: "#fff" }
        );
        this.productionTexts[taskId].setVisible(
          (task.assignedWorkers.level1 + task.assignedWorkers.level2) > 0
        );
      }

      // Add Research Button for Imagined Tasks
      if (task.state === TaskState.Imagined) {
        this.buttons[`${taskId}-research`] = this.add
          .text(35, yOffset + 55, "[Think About This]", { fontSize: "16px", color: "#00f" })
          .setInteractive()
          .on("pointerdown", () => this.handleStartResearch(taskId));
      }

      // Add Focus Button for Imagined and Unthoughtof Tasks
      if (task.state === TaskState.Imagined || task.state === TaskState.Unthoughtof) {
        const focusText = task.isFocused ? "[Stop Focus]" : "[Focus Thinking]";
        const prereqsMet = this.arePrerequisitesMet(taskId);
        this.buttons[`${taskId}-focus`] = this.add
          .text(task.state === TaskState.Imagined ? 200 : 35, yOffset + 55, focusText, 
            { fontSize: "16px", color: task.isFocused ? "#ff0" : (prereqsMet ? "#fff" : "#666") })
          .setAlpha(prereqsMet ? 1 : 0.5);
        
        if (prereqsMet) {
          this.buttons[`${taskId}-focus`]
            .setInteractive()
            .on("pointerdown", () => this.handleToggleFocus(taskId));
        }
      }

      yOffset += 125;
    });
  }

  updateGame() {
    const previousTasks = JSON.parse(JSON.stringify(this.gameState.tasks));
    this.gameState = tickGame(this.gameState);
    this.handleTaskTransitions(previousTasks, this.gameState.tasks);
    this.updateUI();
  }

  updateUI() {
    this.resourceText.setText(this.getResourceText());

    Object.entries(this.gameState.tasks).forEach(([taskId, task]) => {
      this.taskTexts[taskId].setText(this.getTaskText(taskId));
      
      // Update focus button text if it exists
      if (this.buttons[`${taskId}-focus`]) {
        const focusText = task.isFocused ? "[Stop Focus]" : "[Focus Thinking]";
        const prereqsMet = this.arePrerequisitesMet(taskId);
        this.buttons[`${taskId}-focus`].setText(focusText);
        this.buttons[`${taskId}-focus`].setColor(task.isFocused ? "#ff0" : (prereqsMet ? "#fff" : "#666"));
        this.buttons[`${taskId}-focus`].setAlpha(prereqsMet ? 1 : 0.5);
        
        // Remove old listener if it exists
        this.buttons[`${taskId}-focus`].removeAllListeners();
        
        if (prereqsMet) {
          this.buttons[`${taskId}-focus`]
            .setInteractive()
            .on("pointerdown", () => this.handleToggleFocus(taskId));
        } else {
          this.buttons[`${taskId}-focus`].removeInteractive();
        }
      }

      // Handle dynamic button updates based on task state
      if (task.state === TaskState.Discovered) {
        // Remove Focus/Research buttons if they exist
        if (this.buttons[`${taskId}-focus`]) {
          this.buttons[`${taskId}-focus`].destroy();
          delete this.buttons[`${taskId}-focus`];
        }
        if (this.buttons[`${taskId}-research`]) {
          this.buttons[`${taskId}-research`].destroy();
          delete this.buttons[`${taskId}-research`];
        }

        // Create +/- buttons if they don't exist yet
        if (!this.buttons[`${taskId}-minus`]) {
          this.buttons[`${taskId}-minus`] = this.add
            .text(35, this.taskPositions[taskId] + 55, "[-]", { fontSize: "16px", color: "#f00" })
            .setInteractive()
            .on("pointerdown", () => this.handleReassign(taskId, "remove"));
        }
        if (!this.buttons[`${taskId}-plus`]) {
          this.buttons[`${taskId}-plus`] = this.add
            .text(75, this.taskPositions[taskId] + 55, "[+]", { fontSize: "16px", color: "#0f0" })
            .setInteractive()
            .on("pointerdown", () => this.handleReassign(taskId, "add"));
        }

        // Update production text (create it if missing)
        if (!this.productionTexts[taskId]) {
          this.productionTexts[taskId] = this.add.text(
            120,
            this.taskPositions[taskId] + 55,
            "",
            { fontSize: "16px", color: "#fff" }
          );
        }
        this.productionTexts[taskId].setText(this.getProductionText(taskId));
        this.productionTexts[taskId].setVisible(
          (task.assignedWorkers.level1 + task.assignedWorkers.level2) > 0
        );
      } else {
        // If the task is no longer discovered, remove/hide any existing production text
        if (this.productionTexts[taskId]) {
          this.productionTexts[taskId].destroy();
          delete this.productionTexts[taskId];
        }
      }
    });
  }

  getResourceText(): string {
    const food = Math.floor(this.gameState.resources.food);

    const l1ThoughtRate = Object.values(this.gameState.tasks).reduce(
      (sum, t) => sum + (t.productionPerWorker.thoughts ?? 0) * t.assignedWorkers.level1,
      0
    );

    const l2ThoughtRate = Object.values(this.gameState.tasks).reduce(
      (sum, t) => sum + (t.productionPerWorker.thoughts ?? 0) * t.assignedWorkers.level2,
      0
    );

    const totalThoughtRate = l1ThoughtRate + l2ThoughtRate;

    return `🍖 Food: ${food}
    | L1 Workers: ${this.gameState.workers.level1.assigned}/${this.gameState.workers.level1.total}
    | L2 Workers: ${this.gameState.workers.level2.assigned}/${this.gameState.workers.level2.total}
    | 🧠 L1 Thought Rate: ${l1ThoughtRate.toFixed(1)}
    | 🧠 L2 Thought Rate: ${l2ThoughtRate.toFixed(1)}
    | 🧠 Combined Thought Rate: ${totalThoughtRate.toFixed(1)} (* L2 thinking is 1.5 each)`;
  }

  getTaskText(taskId: string): string {
    const task = this.gameState.tasks[taskId];
    let text = `${formatTaskTitle(this.gameState.tasks, taskId)} - ${getTaskStateLabel(task.state)}`;

    if (task.state === TaskState.Discovered) {
      text += ` | L1: ${task.assignedWorkers.level1} | L2: ${task.assignedWorkers.level2}`;
    }

    if (task.state === TaskState.Imagined) {
      const progress = (task.researchProgress.toDiscoveredCurrent / task.researchProgress.toDiscoveredRequired) * 100;
      text += ` | Research Progress: ${progress.toFixed(0)}%`;
    }

    if (task.state === TaskState.Unthoughtof) {
      const progress = (task.researchProgress.toImaginedCurrent / task.researchProgress.toImaginedRequired) * 100;
      text += ` | Research Progress: ${progress.toFixed(0)}%`;
    }

    return text;
  }

  private arePrerequisitesMet(taskId: string): boolean {
    const task = this.gameState.tasks[taskId];
    return task.prerequisites.every(prereq => 
      this.gameState.tasks[prereq].state === TaskState.Discovered
    );
  }

  private getProductionText(taskId: string): string {
    const task = this.gameState.tasks[taskId];
    if ((task.assignedWorkers.level1 + task.assignedWorkers.level2) <= 0) return ""; // No workers, no production text.

    const assignedSum = task.assignedWorkers.level1 + task.assignedWorkers.level2;
    const foodRate = (task.productionPerWorker.food ?? 0) * assignedSum;
    const thoughtRate = (task.productionPerWorker.thoughts ?? 0) * assignedSum;
    
    const parts = [];
    if (foodRate > 0) {
      parts.push(`${foodRate.toFixed(1)} food/sec`);
    }
    if (thoughtRate > 0) {
      parts.push(`${thoughtRate.toFixed(1)} thoughts/sec`);
    }
    return parts.join(" + ");
  }

  private handleTaskTransitions(
    oldTasks: Record<string, Task>,
    newTasks: Record<string, Task>
  ) {
    for (const [taskId, newTask] of Object.entries(newTasks)) {
      const oldTask = oldTasks[taskId];
      
      // Handle Unthoughtof -> Imagined transition
      if (oldTask.state === TaskState.Unthoughtof && newTask.state === TaskState.Imagined) {
        // Reset the task's workers, research progress, and focus
        this.gameState.tasks[taskId].assignedWorkers = { level1: 0, level2: 0 };
        this.gameState.tasks[taskId].researchProgress.toDiscoveredCurrent = 0;
        this.gameState.tasks[taskId].isFocused = false;

        // Show popup
        this.showPopup(`You have imagined the possibility of a new task: ${formatTaskTitle(taskId)}`);
      }
      
      // Handle Imagined -> Discovered transition
      if (oldTask.state === TaskState.Imagined && newTask.state === TaskState.Discovered) {
        this.showPopup(`You have discovered how to perform a new task: ${formatTaskTitle(taskId)}`);
      }
    }
  }

  private showPopup(message: string) {
    const popup = this.add.text(400, 300, message, {
      fontSize: "20px",
      color: "#fff",
      backgroundColor: "#000",
      padding: { x: 10, y: 10 },
    }).setOrigin(0.5);

    this.time.addEvent({
      delay: 3000,
      callback: () => {
        popup.destroy();
      }
    });
  }

  handleReassign(taskId: string, action: "add" | "remove") {
    this.gameState = reassignWorker(this.gameState, taskId, action);
    this.updateUI();
  }

  handleStartResearch(taskId: string) {
    this.gameState = startResearch(this.gameState, taskId);
    this.updateUI();
  }

  handleToggleFocus(taskId: string) {
    this.gameState = toggleTaskFocus(this.gameState, taskId);
    this.updateUI();
  }
}

// Utility Functions
function formatTaskTitle(tasks: Record<string, Task>, taskId: string): string {
  return tasks[taskId]?.title || taskId;
}

function getTaskStateLabel(state: TaskState): string {
  switch (state) {
    case TaskState.Unthoughtof:
      return "????";
    case TaskState.Imagined:
      return "🔎 Imagined";
    case TaskState.Discovered:
      return "✅ Discovered";
    default:
      return "";
  }
}
