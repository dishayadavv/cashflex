import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CurrencyService {

  private selectedCurrencySignal = signal<string>(
    localStorage.getItem('cashflex_currency') || 'INR'
  );

  private exchangeRateSignal = signal<number>(1);

  private loadingSignal = signal<boolean>(false);

  readonly selectedCurrency =
    this.selectedCurrencySignal.asReadonly();

  readonly exchangeRate =
    this.exchangeRateSignal.asReadonly();

  readonly loading =
    this.loadingSignal.asReadonly();


  private symbols: { [key: string]: string } = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£',
    AED: 'د.إ',
    JPY: '¥',
    CAD: 'C$',
    AUD: 'A$'
  };


  // ==========================================
  // LOAD CURRENCY
  // ==========================================

  async loadCurrency(): Promise<void> {

    const currency =
      localStorage.getItem('cashflex_currency') || 'INR';

    this.selectedCurrencySignal.set(currency);

    if (currency === 'INR') {

      this.exchangeRateSignal.set(1);

      return;
    }

    await this.fetchExchangeRate(currency);
  }


  // ==========================================
  // SET CURRENCY
  // ==========================================

  async setCurrency(currency: string): Promise<void> {

    this.loadingSignal.set(true);

    try {

      this.selectedCurrencySignal.set(currency);

      localStorage.setItem(
        'cashflex_currency',
        currency
      );

      if (currency === 'INR') {

        this.exchangeRateSignal.set(1);

        return;
      }

      await this.fetchExchangeRate(currency);

    } finally {

      this.loadingSignal.set(false);
    }
  }


  // ==========================================
  // FETCH EXCHANGE RATE
  // ==========================================

  private async fetchExchangeRate(
    currency: string
  ): Promise<void> {

    try {

      console.log(
        'CURRENCY: Fetching INR →',
        currency
      );


      /*
       * ExchangeRate-API open endpoint.
       *
       * No API key is required for this
       * open-access endpoint.
       */

      const response = await fetch(
        'https://open.er-api.com/v6/latest/INR'
      );


      if (!response.ok) {

        throw new Error(
          `Exchange API returned ${response.status}`
        );
      }


      const data: any =
        await response.json();


      console.log(
        'CURRENCY: API response:',
        data
      );


      if (data?.result !== 'success') {

        throw new Error(
          'Exchange API did not return success.'
        );
      }


      const rate =
        Number(data?.rates?.[currency]);


      if (
        !rate ||
        Number.isNaN(rate) ||
        rate <= 0
      ) {

        throw new Error(
          `No valid exchange rate found for ${currency}.`
        );
      }


      console.log(
        `CURRENCY: INR → ${currency} =`,
        rate
      );


      this.exchangeRateSignal.set(rate);

    } catch (error) {

      console.error(
        'CURRENCY: Exchange rate error:',
        error
      );


      /*
       * Keep the previous rate rather than
       * silently changing it to 1.
       */

      console.warn(
        'CURRENCY: Current exchange rate remains:',
        this.exchangeRateSignal()
      );
    }
  }


  // ==========================================
  // SYMBOL
  // ==========================================

  getSymbol(): string {

    return (
      this.symbols[
        this.selectedCurrency()
      ] ||
      this.selectedCurrency()
    );
  }


  // ==========================================
  // RATE
  // ==========================================

  getRate(): number {

    return this.exchangeRateSignal();
  }


  // ==========================================
  // CONVERT
  // ==========================================

  convert(amount: number): number {

    return (
      Number(amount) *
      this.exchangeRateSignal()
    );
  }


  // ==========================================
  // CURRENT CURRENCY
  // ==========================================

  getCurrency(): string {

    return this.selectedCurrency();
  }

}