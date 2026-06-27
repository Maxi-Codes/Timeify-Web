import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Project } from '../../../../api/models/project';
import { AuthService } from '../../../../core/auth/auth.service';
import { ProjectsService } from '../../../../core/services/projects.service';
import { ButtonComponent } from '../../../../shared/components/button/button';
import { InputComponent } from '../../../../shared/components/input/input';
import { ModalComponent } from '../../../../shared/components/modal/modal';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [ReactiveFormsModule, ButtonComponent, InputComponent, ModalComponent],
  templateUrl: './projects.html',
})
export class ProjectsPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly projectsService = inject(ProjectsService);
  private readonly auth = inject(AuthService);

  readonly projects = signal<Project[]>([]);
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly modalOpen = signal(false);
  readonly editingProject = signal<Project | null>(null);
  readonly errorMessage = signal('');

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    description: [''],
    street: [''],
    houseNumber: [''],
    postalCode: [''],
    city: [''],
    country: ['Deutschland'],
    isActive: [true],
  });

  ngOnInit(): void {
    this.loadProjects();
  }

  loadProjects(): void {
    this.isLoading.set(true);
    this.projectsService.getAll().subscribe({
      next: (projects) => {
        this.projects.set(projects);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  openCreateModal(): void {
    this.editingProject.set(null);
    this.form.reset({
      name: '',
      description: '',
      street: '',
      houseNumber: '',
      postalCode: '',
      city: '',
      country: 'Deutschland',
      isActive: true,
    });
    this.errorMessage.set('');
    this.modalOpen.set(true);
  }

  openEditModal(project: Project): void {
    this.editingProject.set(project);
    this.form.patchValue({
      name: project.name ?? '',
      description: project.description ?? '',
      street: project.address?.street ?? '',
      houseNumber: project.address?.houseNumber ?? '',
      postalCode: project.address?.postalCode ?? '',
      city: project.address?.city ?? '',
      country: project.address?.country ?? 'Deutschland',
      isActive: project.isActive ?? true,
    });
    this.errorMessage.set('');
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const companyId = this.auth.getCompanyId();
    if (!companyId) {
      this.errorMessage.set('Unternehmen nicht gefunden. Bitte erneut anmelden.');
      return;
    }

    const address = {
      street: raw.street || null,
      houseNumber: raw.houseNumber || null,
      postalCode: raw.postalCode || null,
      city: raw.city || null,
      country: raw.country || null,
    };

    this.isSaving.set(true);
    this.errorMessage.set('');

    const editing = this.editingProject();

    if (editing?.id) {
      const payload: Project = {
        ...editing,
        name: raw.name,
        description: raw.description || null,
        address,
        isActive: raw.isActive,
        updatedAt: new Date().toISOString(),
      };

      this.projectsService.update(editing.id, payload).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.closeModal();
          this.loadProjects();
        },
        error: () => {
          this.isSaving.set(false);
          this.errorMessage.set('Projekt konnte nicht gespeichert werden.');
        },
      });
      return;
    }

    const payload: Project = {
      id: crypto.randomUUID(),
      companyId,
      name: raw.name,
      description: raw.description || null,
      address,
      isActive: raw.isActive,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.projectsService.create(payload).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.closeModal();
        this.loadProjects();
      },
      error: () => {
        this.isSaving.set(false);
        this.errorMessage.set('Projekt konnte nicht angelegt werden.');
      },
    });
  }

  deleteProject(project: Project): void {
    if (!project.id) return;
    if (!confirm(`Projekt „${project.name}“ wirklich löschen?`)) return;

    this.projectsService.delete(project.id).subscribe({
      next: () => this.loadProjects(),
      error: () => alert('Projekt konnte nicht gelöscht werden.'),
    });
  }

  fieldError(field: 'name'): string {
    const control = this.form.controls[field];
    if (!control.touched || !control.errors) return '';
    if (control.errors['required']) return 'Pflichtfeld';
    return '';
  }
}
