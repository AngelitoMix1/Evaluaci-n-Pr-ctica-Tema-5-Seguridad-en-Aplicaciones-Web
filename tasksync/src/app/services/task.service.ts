import { Injectable } from '@angular/core';
import axios from 'axios';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private apiUrl = 'https://localhost:3000'; // Cambiado a https

  private getHeaders() {
    const token = sessionStorage.getItem('jwt_token');
    return {
      headers: { Authorization: `Bearer ${token}` }
    };
  }

  async login(userData: any) {
    const response = await axios.post(`${this.apiUrl}/api/login`, userData);
    return response.data;
  }

  async register(userData: any) {
    const response = await axios.post(`${this.apiUrl}/api/register`, userData);
    return response.data;
  }

  async getTasks() {
    const response = await axios.get(`${this.apiUrl}/tasks`, this.getHeaders());
    return response.data;
  }

  async addTask(title: string, username: string) {
    const response = await axios.post(`${this.apiUrl}/tasks`, { title, username }, this.getHeaders());
    return response.data;
  }

  async updateTask(id: number, data: any, username: string) {
    const response = await axios.put(`${this.apiUrl}/tasks/${id}`, { ...data, username }, this.getHeaders());
    return response.data;
  }

  async deleteTask(id: number, username: string) {
    await axios.delete(`${this.apiUrl}/tasks/${id}`, {
      ...this.getHeaders(),
      params: { username }
    });
  }
}