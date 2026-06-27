import { Injectable } from '@angular/core';

export interface AccountFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface CompanyFormData {
  companyName: string;
  street: string;
  houseNumber: number;
  postalCode: number;
  city: string;
  country: string;
}

@Injectable({ providedIn: 'root' })
export class RegisterStateService {
  account: AccountFormData | null = null;
  company: CompanyFormData | null = null;

  setAccount(data: AccountFormData): void {
    this.account = data;
  }

  setCompany(data: CompanyFormData): void {
    this.company = data;
  }

  clear(): void {
    this.account = null;
    this.company = null;
  }
}
