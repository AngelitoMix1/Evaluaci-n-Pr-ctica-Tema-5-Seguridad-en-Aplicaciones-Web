import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService } from './services/task.service';
import { SocketService } from './services/socket.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  // Variables del Tablero
  tasks: any[] = [];
  newTaskTitle: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';
  editingTaskId: number | null = null;
  editTaskTitle: string = '';
  notificationMessage: string | null = null;
  notificationTimeout: any;

  // Variables de Control de Acceso
  isLoggedIn: boolean = false;
  isRegisterMode: boolean = false;
  username: string = '';
  authData = { username: '', password: '' };

  constructor(
    private taskService: TaskService,
    private socketService: SocketService,
    private cdr: ChangeDetectorRef
  ) {}

  showNotification(message: string) {
    this.notificationMessage = message;
    this.cdr.detectChanges();
    if (this.notificationTimeout) clearTimeout(this.notificationTimeout);
    this.notificationTimeout = setTimeout(() => {
      this.notificationMessage = null;
      this.cdr.detectChanges();
    }, 3500);
  }

  ngOnInit() {
    // Validar si existía una sesión previa activa en el navegador
    const savedToken = sessionStorage.getItem('jwt_token');
    const savedUser = sessionStorage.getItem('username');
    
    if (savedToken && savedUser) {
      this.username = savedUser;
      this.isLoggedIn = true;
      this.initializeSecureDashboard(savedToken);
    }
  }

  async handleAuth() {
    if (!this.authData.username.trim() || !this.authData.password.trim()) {
      this.errorMessage = 'Por favor complete todos los campos.';
      return;
    }

    try {
      this.errorMessage = '';
      if (this.isRegisterMode) {
        await this.taskService.register(this.authData);
        this.showNotification('✨ Registro completado. Ya puedes iniciar sesión.');
        this.isRegisterMode = false;
        this.authData.password = '';
        this.cdr.detectChanges(); // <--- Despierta a Angular
      } else {
        const res = await this.taskService.login(this.authData);
        sessionStorage.setItem('jwt_token', res.token);
        sessionStorage.setItem('username', res.username);
        this.username = res.username;
        this.isLoggedIn = true;
        this.authData = { username: '', password: '' };
        this.initializeSecureDashboard(res.token);
        this.cdr.detectChanges(); // <--- Fuerza el cambio a la vista del tablero
      }
    } catch (error: any) {
      console.error("Error capturado por Axios:", error); // <--- Para ver el error exacto en consola si vuelve a fallar
      this.errorMessage = error.response?.data?.message || 'Error en la autenticación.';
      this.cdr.detectChanges(); // <--- Muestra el error visualmente
    }
  }

  async initializeSecureDashboard(token: string) {
    this.isLoading = true;
    this.cdr.detectChanges(); // <--- Muestra el texto "Cargando..."
    try {
      this.tasks = await this.taskService.getTasks();
      
      // Conectar y suscribir los Sockets pasando el JWT
      this.socketService.connect(token);
      this.setupSocketListeners();
    } catch (error: any) {
      this.handleSessionExpiration(error);
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges(); // <--- Quita el texto "Cargando..." y muestra las tareas
    }
  }

  setupSocketListeners() {
    this.socketService.listen('taskAdded').subscribe({
      next: (data: any) => {
        if (!this.tasks.find(t => t.id === data.task.id)) {
          this.tasks.push(data.task);
          if (data.username !== this.username) {
            this.showNotification(`✨ ${data.username} agregó una nueva tarea`);
          }
        }
      },
      error: () => this.showNotification('⚠️ Error en la conexión de actualización.')
    });

    this.socketService.listen('taskUpdated').subscribe((data: any) => {
      const index = this.tasks.findIndex(t => t.id === data.task.id);
      if (index !== -1) {
        this.tasks[index] = data.task;
        if (data.username !== this.username) {
          this.showNotification(`✏️ ${data.username} actualizó una tarea`);
        }
      }
    });

    this.socketService.listen('taskDeleted').subscribe((data: any) => {
      this.tasks = this.tasks.filter(t => t.id !== data.id);
      if (data.username !== this.username) {
        this.showNotification(`🗑️ ${data.username} eliminó una tarea`);
      }
    });
  }

  handleSessionExpiration(error: any) {
    // Detectar expiración o manipulación (401 o 403)
    if (error.response?.status === 401 || error.response?.status === 403) {
      this.forceLogout();
      this.errorMessage = 'Su sesión ha expirado o es inválida. Inicie sesión nuevamente.';
    } else {
      this.errorMessage = 'Error de comunicación con el servidor.';
    }
  }

  async forceLogout() {
    // Cierre de sesión local (Opción B)
    sessionStorage.clear();
    this.socketService.disconnect();
    this.isLoggedIn = false;
    this.tasks = [];
  }

  // --- MÉTODOS DEL TABLERO CRUD ---
  async addTask() {
    if (!this.newTaskTitle.trim()) return;
    try {
      this.errorMessage = '';
      await this.taskService.addTask(this.newTaskTitle, this.username);
      this.newTaskTitle = '';
    } catch (error) {
      this.handleSessionExpiration(error);
    }
  }

  async toggleTask(task: any) {
    try {
      this.errorMessage = '';
      await this.taskService.updateTask(task.id, { completed: !task.completed }, this.username);
    } catch (error) {
      task.completed = !task.completed;
      this.handleSessionExpiration(error);
    }
  }

  startEdit(task: any) {
    this.editingTaskId = task.id;
    this.editTaskTitle = task.title;
  }

  cancelEdit() {
    this.editingTaskId = null;
    this.editTaskTitle = '';
  }

  async saveEdit(task: any) {
    if (!this.editTaskTitle.trim()) return;
    try {
      this.errorMessage = '';
      await this.taskService.updateTask(task.id, { title: this.editTaskTitle }, this.username);
      this.cancelEdit();
    } catch (error) {
      this.handleSessionExpiration(error);
    }
  }

  async deleteTask(id: number) {
    try {
      this.errorMessage = '';
      await this.taskService.deleteTask(id, this.username);
    } catch (error) {
      this.handleSessionExpiration(error);
    }
  }
}