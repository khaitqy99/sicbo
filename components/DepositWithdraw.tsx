import React, { useState } from 'react';
import { X, ArrowDownCircle, ArrowUpCircle, CreditCard, Wallet, History, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Transaction, TransactionType } from '../types';

interface DepositWithdrawProps {
  isOpen: boolean;
  onClose: () => void;
  balance: number;
  onDeposit: (amount: number, method: string) => void;
  onWithdraw: (amount: number, method: string) => void;
  transactions: Transaction[];
}

const QUICK_AMOUNTS = [100000, 500000, 1000000, 5000000, 10000000, 50000000];
const PAYMENT_METHODS = [
  { id: 'BANK', name: 'Chuyển khoản ngân hàng', icon: CreditCard },
  { id: 'EWALLET', name: 'Ví điện tử', icon: Wallet },
  { id: 'CRYPTO', name: 'Tiền điện tử', icon: Wallet },
];

const DepositWithdraw: React.FC<DepositWithdrawProps> = ({
  isOpen,
  onClose,
  balance,
  onDeposit,
  onWithdraw,
  transactions,
}) => {
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw' | 'history'>('deposit');
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('BANK');
  const [customAmount, setCustomAmount] = useState('');

  if (!isOpen) return null;

  const handleQuickAmount = (value: number) => {
    setAmount(value.toString());
    setCustomAmount(value.toString());
  };

  const handleCustomAmount = (value: string) => {
    // Only allow numbers
    const numericValue = value.replace(/[^0-9]/g, '');
    setCustomAmount(numericValue);
    setAmount(numericValue);
  };

  const handleSubmit = () => {
    const numAmount = parseInt(amount);
    if (!numAmount || numAmount <= 0) {
      alert('Vui lòng nhập số tiền hợp lệ!');
      return;
    }

    if (activeTab === 'deposit') {
      if (numAmount < 10000) {
        alert('Số tiền nạp tối thiểu là 10,000 VNĐ!');
        return;
      }
      onDeposit(numAmount, selectedMethod);
      setAmount('');
      setCustomAmount('');
    } else if (activeTab === 'withdraw') {
      if (numAmount > balance) {
        alert('Số dư không đủ để rút tiền!');
        return;
      }
      if (numAmount < 50000) {
        alert('Số tiền rút tối thiểu là 50,000 VNĐ!');
        return;
      }
      onWithdraw(numAmount, selectedMethod);
      setAmount('');
      setCustomAmount('');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN').format(value) + ' VNĐ';
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle2 size={16} className="text-green-500" />;
      case 'PENDING':
        return <Clock size={16} className="text-yellow-500" />;
      case 'FAILED':
        return <XCircle size={16} className="text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'Thành công';
      case 'PENDING':
        return 'Đang xử lý';
      case 'FAILED':
        return 'Thất bại';
      default:
        return status;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-2 sm:p-4">
      <div className="bg-gradient-to-br from-[#1a0a0a] to-[#2d0f0f] border-2 border-yellow-600 rounded-xl shadow-2xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border-b border-yellow-600/50 p-3 sm:p-4 flex justify-between items-center shrink-0">
          <h2 className="text-lg sm:text-2xl font-bold text-yellow-400 flex items-center gap-1 sm:gap-2">
            <Wallet size={18} className="sm:w-6 sm:h-6" />
            <span className="hidden sm:inline">Nạp / Rút Tiền</span>
            <span className="sm:hidden">Nạp/Rút</span>
          </h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white text-xl sm:text-2xl transition-colors p-1"
          >
            <X size={20} className="sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Balance Display */}
        <div className="p-3 sm:p-4 bg-black/40 border-b border-yellow-600/30 shrink-0">
          <div className="text-xs sm:text-sm text-yellow-500/80 mb-1">Số dư hiện tại</div>
          <div className="text-xl sm:text-2xl md:text-3xl font-bold text-yellow-400 font-mono break-all">
            {formatCurrency(balance)}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-yellow-600/30 shrink-0">
          <button
            onClick={() => setActiveTab('deposit')}
            className={`flex-1 px-2 sm:px-4 py-2 sm:py-3 font-semibold transition-all text-xs sm:text-base ${
              activeTab === 'deposit'
                ? 'bg-yellow-600/20 text-yellow-400 border-b-2 border-yellow-500'
                : 'text-white/60 hover:text-white hover:bg-black/20'
            }`}
          >
            <div className="flex items-center justify-center gap-1 sm:gap-2">
              <ArrowDownCircle size={14} className="sm:w-[18px] sm:h-[18px]" />
              <span className="hidden sm:inline">Nạp Tiền</span>
              <span className="sm:hidden">Nạp</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('withdraw')}
            className={`flex-1 px-2 sm:px-4 py-2 sm:py-3 font-semibold transition-all text-xs sm:text-base ${
              activeTab === 'withdraw'
                ? 'bg-yellow-600/20 text-yellow-400 border-b-2 border-yellow-500'
                : 'text-white/60 hover:text-white hover:bg-black/20'
            }`}
          >
            <div className="flex items-center justify-center gap-1 sm:gap-2">
              <ArrowUpCircle size={14} className="sm:w-[18px] sm:h-[18px]" />
              <span className="hidden sm:inline">Rút Tiền</span>
              <span className="sm:hidden">Rút</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 px-2 sm:px-4 py-2 sm:py-3 font-semibold transition-all text-xs sm:text-base ${
              activeTab === 'history'
                ? 'bg-yellow-600/20 text-yellow-400 border-b-2 border-yellow-500'
                : 'text-white/60 hover:text-white hover:bg-black/20'
            }`}
          >
            <div className="flex items-center justify-center gap-1 sm:gap-2">
              <History size={14} className="sm:w-[18px] sm:h-[18px]" />
              <span className="hidden sm:inline">Lịch Sử</span>
              <span className="sm:hidden">LS</span>
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 min-h-0">
          {activeTab === 'deposit' && (
            <div className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-yellow-400 font-semibold mb-2 sm:mb-3 text-sm sm:text-base">
                  Chọn số tiền nạp
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mb-3 sm:mb-4">
                  {QUICK_AMOUNTS.map((value) => (
                    <button
                      key={value}
                      onClick={() => handleQuickAmount(value)}
                      className={`p-2 sm:p-3 rounded-lg border-2 transition-all ${
                        amount === value.toString()
                          ? 'border-yellow-500 bg-yellow-600/20 text-yellow-400'
                          : 'border-yellow-600/30 bg-black/20 text-white hover:border-yellow-500/50'
                      }`}
                    >
                      <div className="font-bold text-xs sm:text-sm">
                        {value >= 1000000 ? `${value / 1000000}M` : `${value / 1000}k`}
                      </div>
                      <div className="text-[10px] sm:text-xs text-white/60">VNĐ</div>
                    </button>
                  ))}
                </div>
                <div className="mt-3 sm:mt-4">
                  <label className="block text-yellow-400 font-semibold mb-2 text-sm sm:text-base">
                    Hoặc nhập số tiền tùy chỉnh
                  </label>
                  <input
                    type="text"
                    value={customAmount}
                    onChange={(e) => handleCustomAmount(e.target.value)}
                    placeholder="Nhập số tiền (VNĐ)"
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-black/40 border border-yellow-600/50 rounded-lg text-white font-mono text-sm sm:text-base md:text-lg focus:outline-none focus:border-yellow-500"
                  />
                  {customAmount && (
                    <div className="mt-2 text-xs sm:text-sm text-white/60 break-all">
                      = {formatCurrency(parseInt(customAmount) || 0)}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-yellow-400 font-semibold mb-2 sm:mb-3 text-sm sm:text-base">
                  Phương thức thanh toán
                </label>
                <div className="space-y-2">
                  {PAYMENT_METHODS.map((method) => {
                    const Icon = method.icon;
                    return (
                      <button
                        key={method.id}
                        onClick={() => setSelectedMethod(method.id)}
                        className={`w-full p-2.5 sm:p-3 rounded-lg border-2 transition-all flex items-center gap-2 sm:gap-3 ${
                          selectedMethod === method.id
                            ? 'border-yellow-500 bg-yellow-600/20'
                            : 'border-yellow-600/30 bg-black/20 hover:border-yellow-500/50'
                        }`}
                      >
                        <Icon size={18} className={`sm:w-5 sm:h-5 flex-shrink-0 ${selectedMethod === method.id ? 'text-yellow-400' : 'text-white/60'}`} />
                        <span className={`text-sm sm:text-base ${selectedMethod === method.id ? 'text-yellow-400 font-semibold' : 'text-white'}`}>
                          {method.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={!amount || parseInt(amount) <= 0}
                className="w-full py-3 sm:py-4 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 rounded-lg font-bold text-white text-sm sm:text-base md:text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                Nạp {amount ? formatCurrency(parseInt(amount)) : 'Tiền'}
              </button>
            </div>
          )}

          {activeTab === 'withdraw' && (
            <div className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-yellow-400 font-semibold mb-2 sm:mb-3 text-sm sm:text-base">
                  Chọn số tiền rút
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mb-3 sm:mb-4">
                  {QUICK_AMOUNTS.map((value) => (
                    <button
                      key={value}
                      onClick={() => handleQuickAmount(value)}
                      disabled={value > balance}
                      className={`p-2 sm:p-3 rounded-lg border-2 transition-all ${
                        value > balance
                          ? 'opacity-50 cursor-not-allowed border-gray-600/30 bg-gray-900/20'
                          : amount === value.toString()
                          ? 'border-yellow-500 bg-yellow-600/20 text-yellow-400'
                          : 'border-yellow-600/30 bg-black/20 text-white hover:border-yellow-500/50'
                      }`}
                    >
                      <div className="font-bold text-xs sm:text-sm">
                        {value >= 1000000 ? `${value / 1000000}M` : `${value / 1000}k`}
                      </div>
                      <div className="text-[10px] sm:text-xs text-white/60">VNĐ</div>
                    </button>
                  ))}
                </div>
                <div className="mt-3 sm:mt-4">
                  <label className="block text-yellow-400 font-semibold mb-2 text-sm sm:text-base">
                    Hoặc nhập số tiền tùy chỉnh
                  </label>
                  <input
                    type="text"
                    value={customAmount}
                    onChange={(e) => handleCustomAmount(e.target.value)}
                    placeholder="Nhập số tiền (VNĐ)"
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-black/40 border border-yellow-600/50 rounded-lg text-white font-mono text-sm sm:text-base md:text-lg focus:outline-none focus:border-yellow-500"
                  />
                  {customAmount && (
                    <div className="mt-2 text-xs sm:text-sm text-white/60 break-all">
                      = {formatCurrency(parseInt(customAmount) || 0)}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-yellow-400 font-semibold mb-2 sm:mb-3 text-sm sm:text-base">
                  Phương thức nhận tiền
                </label>
                <div className="space-y-2">
                  {PAYMENT_METHODS.map((method) => {
                    const Icon = method.icon;
                    return (
                      <button
                        key={method.id}
                        onClick={() => setSelectedMethod(method.id)}
                        className={`w-full p-2.5 sm:p-3 rounded-lg border-2 transition-all flex items-center gap-2 sm:gap-3 ${
                          selectedMethod === method.id
                            ? 'border-yellow-500 bg-yellow-600/20'
                            : 'border-yellow-600/30 bg-black/20 hover:border-yellow-500/50'
                        }`}
                      >
                        <Icon size={18} className={`sm:w-5 sm:h-5 flex-shrink-0 ${selectedMethod === method.id ? 'text-yellow-400' : 'text-white/60'}`} />
                        <span className={`text-sm sm:text-base ${selectedMethod === method.id ? 'text-yellow-400 font-semibold' : 'text-white'}`}>
                          {method.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={!amount || parseInt(amount) <= 0 || parseInt(amount) > balance}
                className="w-full py-3 sm:py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-lg font-bold text-white text-sm sm:text-base md:text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                Rút {amount ? formatCurrency(parseInt(amount)) : 'Tiền'}
              </button>
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              <div className="text-yellow-400 font-semibold mb-3 sm:mb-4 text-sm sm:text-base">
                Lịch sử giao dịch ({transactions.length})
              </div>
              {transactions.length === 0 ? (
                <div className="text-center py-8 sm:py-12 text-white/60">
                  <History size={36} className="sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                  <p className="text-sm sm:text-base">Chưa có giao dịch nào</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[50vh] sm:max-h-[400px] overflow-y-auto -mr-2 pr-2">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="bg-black/40 border border-yellow-600/30 rounded-lg p-3 sm:p-4 hover:bg-black/60 transition-colors"
                    >
                      <div className="flex items-start sm:items-center justify-between gap-2">
                        <div className="flex items-start sm:items-center gap-2 sm:gap-3 flex-1 min-w-0">
                          {transaction.type === TransactionType.DEPOSIT ? (
                            <ArrowDownCircle size={16} className="sm:w-5 sm:h-5 text-green-400 flex-shrink-0 mt-0.5 sm:mt-0" />
                          ) : (
                            <ArrowUpCircle size={16} className="sm:w-5 sm:h-5 text-red-400 flex-shrink-0 mt-0.5 sm:mt-0" />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-white text-sm sm:text-base">
                              {transaction.type === TransactionType.DEPOSIT ? 'Nạp tiền' : 'Rút tiền'}
                            </div>
                            <div className="text-xs sm:text-sm text-white/60 break-words">
                              {formatDate(transaction.timestamp)}
                            </div>
                            {transaction.method && (
                              <div className="text-[10px] sm:text-xs text-white/40 mt-1 break-words">
                                {PAYMENT_METHODS.find(m => m.id === transaction.method)?.name || transaction.method}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div
                            className={`font-bold text-sm sm:text-base md:text-lg break-all ${
                              transaction.type === TransactionType.DEPOSIT ? 'text-green-400' : 'text-red-400'
                            }`}
                          >
                            {transaction.type === TransactionType.DEPOSIT ? '+' : '-'}
                            {formatCurrency(transaction.amount)}
                          </div>
                          <div className="flex items-center gap-1 justify-end mt-1">
                            {getStatusIcon(transaction.status)}
                            <span className="text-[10px] sm:text-xs text-white/60">
                              {getStatusText(transaction.status)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DepositWithdraw;

