import { describe, test, expect, vi } from 'vitest';

// Mock the stellar.ts library to prevent loading the browser-only StellarWalletsKit in Node/Vitest
vi.mock('../lib/stellar', () => ({
  isValidPublicKey: (address: string) => {
    return typeof address === 'string' && address.startsWith('G') && address.length === 56;
  },
  fetchXlmBalance: vi.fn(),
  sendPayment: vi.fn(),
  executeContractCall: vi.fn(),
  getSplitStatusOnChain: vi.fn(),
  getRecentEvents: vi.fn(),
}));

import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from '../components/Header';
import { SplitForm } from '../components/SplitForm';

describe('Header Wallet Button States', () => {
  test('renders Connect Wallet when address is null', () => {
    const connectMock = vi.fn();
    const disconnectMock = vi.fn();
    render(
      <Header
        address={null}
        connect={connectMock}
        disconnect={disconnectMock}
        isConnecting={false}
      />
    );

    const button = screen.getByText('Connect Wallet');
    expect(button).toBeInTheDocument();
    
    fireEvent.click(button);
    expect(connectMock).toHaveBeenCalledTimes(1);
  });

  test('renders Connecting... when isConnecting is true', () => {
    render(
      <Header
        address={null}
        connect={() => {}}
        disconnect={() => {}}
        isConnecting={true}
      />
    );

    expect(screen.getByText('Connecting...')).toBeInTheDocument();
  });

  test('renders shortened address when address is provided', () => {
    const address = 'GBXBZYRUXADVOOB5TIBNDHMCH7TAUEEUDJDV5WLOBWIZMUVFBXHXQ76N';
    render(
      <Header
        address={address}
        connect={() => {}}
        disconnect={() => {}}
        isConnecting={false}
      />
    );

    expect(screen.getByText('GBXBZY...Q76N')).toBeInTheDocument();
  });
});

describe('SplitForm Calculation Logic', () => {
  test('renders correct share calculation based on bill total and people count', () => {
    render(
      <SplitForm
        senderAddress="GBXBZYRUXADVOOB5TIBNDHMCH7TAUEEUDJDV5WLOBWIZMUVFBXHXQ76N"
        senderBalance="100.0"
        onSendPayments={() => {}}
        isSending={false}
      />
    );

    // Default bill: 10 XLM, default people: 3.
    // Each person's share: 3.3333333 XLM.
    expect(screen.getByText("Each Person's Share:")).toBeInTheDocument();
    expect(screen.getAllByText("3.3333333 XLM").length).toBeGreaterThanOrEqual(1);

    // Change total bill to 30
    const totalInput = screen.getByLabelText(/Total Bill Amount/i);
    fireEvent.change(totalInput, { target: { value: '30' } });

    // Share should now be 10.0000000 XLM
    expect(screen.getAllByText("10.0000000 XLM").length).toBeGreaterThanOrEqual(1);
  });
});
