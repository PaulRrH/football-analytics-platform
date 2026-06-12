import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { finalize } from 'rxjs';
import { AuditLogEntry } from '../../../../core/models';
import { AuditLogService } from '../../../../core/services/audit-log.service';
import { resolveErrorMessage } from '../../../../core/utils/http-error.util';

@Component({
  selector: 'app-audit-log-list',
  imports: [DatePipe, MatCardModule, MatPaginatorModule, MatProgressSpinnerModule, MatTableModule],
  templateUrl: './audit-log-list.html',
  styleUrl: './audit-log-list.scss',
})
export class AuditLogList implements OnInit {
  private readonly auditLogService = inject(AuditLogService);

  readonly displayedColumns = [
    'createdAt',
    'userEmail',
    'method',
    'entityType',
    'entityId',
    'statusCode',
  ];

  readonly entries = signal<AuditLogEntry[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly limit = signal(10);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.loadEntries();
  }

  onPageChange(event: PageEvent): void {
    this.page.set(event.pageIndex + 1);
    this.limit.set(event.pageSize);
    this.loadEntries();
  }

  private loadEntries(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.auditLogService
      .findAll({ page: this.page(), limit: this.limit() })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          this.entries.set(res.data);
          this.total.set(res.meta.total);
        },
        error: (err: unknown) => {
          this.errorMessage.set(
            resolveErrorMessage(err, 'No se pudo cargar el registro de auditoría.'),
          );
        },
      });
  }
}
