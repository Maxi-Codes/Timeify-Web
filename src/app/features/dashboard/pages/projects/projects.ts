import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Project } from '../../../../api/models/project';
import { ProjectAddressDto } from '../../../../api/models/project-address-dto';
import { AuthService } from '../../../../core/auth/auth.service';
import { ProjectsService } from '../../../../core/services/projects.service';
import { buildAddressString } from '../../../../core/utils/project-address.util';
import { ButtonComponent } from '../../../../shared/components/button/button';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { InputComponent } from '../../../../shared/components/input/input';
import { ModalComponent } from '../../../../shared/components/modal/modal';
import { ProjectMapComponent } from '../../../../shared/components/project-map/project-map';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonComponent,
    InputComponent,
    ModalComponent,
    ConfirmDialogComponent,
    ProjectMapComponent,
  ],
  templateUrl: './projects.html',
})
export class ProjectsPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly projectsService = inject(ProjectsService);
  private readonly auth = inject(AuthService);

  readonly projects = signal<Project[]>([]);
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly formModalOpen = signal(false);
  readonly viewModalOpen = signal(false);
  readonly deleteConfirmOpen = signal(false);
  readonly editingProject = signal<Project | null>(null);
  readonly viewingProject = signal<Project | null>(null);
  readonly projectToDelete = signal<Project | null>(null);
  readonly errorMessage = signal('');
  readonly deleteError = signal('');
  readonly isDeleting = signal(false);

  readonly mapLatitude = signal<number | null>(null);
  readonly mapLongitude = signal<number | null>(null);

  readonly form = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    street: [''],
    houseNumber: [''],
    postalCode: [''],
    city: [''],
    country: ['Deutschland'],
    latitude: [null as number | null],
    longitude: [null as number | null],
    isActive: [true],
  });

  readonly formAddress = computed<ProjectAddressDto>(() => {
    const raw = this.form.getRawValue();
    return {
      street: raw.street || null,
      houseNumber: raw.houseNumber || null,
      postalCode: raw.postalCode || null,
      city: raw.city || null,
      country: raw.country || null,
      latitude: raw.latitude,
      longitude: raw.longitude,
    };
  });

  private syncMapFromForm(): void {
    const raw = this.form.getRawValue();
    this.mapLatitude.set(raw.latitude);
    this.mapLongitude.set(raw.longitude);
  }

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
      latitude: null,
      longitude: null,
      isActive: true,
    });
    this.mapLatitude.set(null);
    this.mapLongitude.set(null);
    this.errorMessage.set('');
    this.syncMapFromForm();
    this.formModalOpen.set(true);
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
      latitude: project.address?.latitude ?? null,
      longitude: project.address?.longitude ?? null,
      isActive: project.isActive ?? true,
    });
    this.errorMessage.set('');
    this.syncMapFromForm();
    this.formModalOpen.set(true);
  }

  openViewModal(project: Project): void {
    if (!project.id) return;

    this.projectsService.getById(project.id).subscribe({
      next: (fresh) => {
        this.viewingProject.set(fresh);
        this.viewModalOpen.set(true);
      },
      error: () => {
        this.viewingProject.set(project);
        this.viewModalOpen.set(true);
      },
    });
  }

  closeFormModal(): void {
    this.formModalOpen.set(false);
  }

  closeViewModal(): void {
    this.viewModalOpen.set(false);
    this.viewingProject.set(null);
  }

  setLatitude(value: number): void {
    this.form.patchValue({ latitude: value });
    this.mapLatitude.set(value);
  }

  setLongitude(value: number): void {
    this.form.patchValue({ longitude: value });
    this.mapLongitude.set(value);
  }

  setAddressFromMap(address: ProjectAddressDto): void {
    this.form.patchValue({
      street: address.street ?? '',
      houseNumber: address.houseNumber ?? '',
      postalCode: address.postalCode ?? '',
      city: address.city ?? '',
      country: address.country ?? '',
      latitude: address.latitude ?? null,
      longitude: address.longitude ?? null,
    });
    this.mapLatitude.set(address.latitude ?? null);
    this.mapLongitude.set(address.longitude ?? null);
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

    const address: ProjectAddressDto = {
      street: raw.street || null,
      houseNumber: raw.houseNumber || null,
      postalCode: raw.postalCode || null,
      city: raw.city || null,
      country: raw.country || null,
      latitude: raw.latitude,
      longitude: raw.longitude,
    };

    this.isSaving.set(true);
    this.errorMessage.set('');

    const editing = this.editingProject();

    if (editing?.id) {
      this.projectsService
        .update(editing.id, {
          name: raw.name,
          description: raw.description || null,
          address,
          isActive: raw.isActive ?? true,
        })
        .subscribe({
          next: () => {
            this.isSaving.set(false);
            this.closeFormModal();
            this.loadProjects();
          },
          error: () => {
            this.isSaving.set(false);
            this.errorMessage.set('Projekt konnte nicht gespeichert werden.');
          },
        });
      return;
    }

    this.projectsService
      .create({
        companyId,
        name: raw.name,
        description: raw.description || null,
        address,
      })
      .subscribe({
        next: () => {
          this.isSaving.set(false);
          this.closeFormModal();
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
    this.projectToDelete.set(project);
    this.deleteError.set('');
    this.deleteConfirmOpen.set(true);
  }

  closeDeleteConfirm(): void {
    this.deleteConfirmOpen.set(false);
    this.projectToDelete.set(null);
    this.deleteError.set('');
  }

  confirmDelete(): void {
    const project = this.projectToDelete();
    if (!project?.id) return;

    this.isDeleting.set(true);
    this.deleteError.set('');

    this.projectsService.delete(project.id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.closeDeleteConfirm();
        this.loadProjects();
      },
      error: () => {
        this.isDeleting.set(false);
        this.deleteError.set('Projekt konnte nicht gelöscht werden.');
      },
    });
  }

  deleteConfirmMessage(): string {
    const project = this.projectToDelete();
    if (!project) return '';
    return `Möchtest du das Projekt „${project.name}“ wirklich löschen?`;
  }

  formatAddress(project: Project | null): string {
    return buildAddressString(project?.address) || '—';
  }

  fieldError(field: 'name'): string {
    const control = this.form.controls[field];
    if (!control.touched || !control.errors) return '';
    if (control.errors['required']) return 'Pflichtfeld';
    return '';
  }
}
