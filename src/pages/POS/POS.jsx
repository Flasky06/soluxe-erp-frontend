import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { CreditCard, Bed } from 'lucide-react';

const POS = () => {
    const [menuItems, setMenuItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [stays, setStays] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // POS Cart State
    const [cart, setCart] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [checkoutMode, setCheckoutMode] = useState(null); // 'PAY_NOW' | 'CHARGE_TO_ROOM' | null
    const [selectedStayId, setSelectedStayId] = useState('');
    const [guestName, setGuestName] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [menuRes, catRes, staysRes] = await Promise.all([
                    api.get('/menu-items'),
                    api.get('/menu-categories'),
                    api.get('/stays')
                ]);
                setMenuItems(menuRes.data);
                setCategories(catRes.data);
                setStays(staysRes.data.filter(s => s.status === 'ACTIVE'));
            } catch (err) {
                console.error('Failed to fetch POS data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const addToCart = (item) => {
        const existing = cart.find(c => c.menuItem.id === item.id);
        if (existing) {
            setCart(cart.map(c => c.menuItem.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
        } else {
            setCart([...cart, { menuItem: item, quantity: 1 }]);
        }
    };

    const removeFromCart = (itemId) => {
        setCart(cart.filter(c => c.menuItem.id !== itemId));
    };

    const updateQuantity = (itemId, delta) => {
        setCart(cart.map(c => {
            if (c.menuItem.id === itemId) {
                const newQ = c.quantity + delta;
                return newQ > 0 ? { ...c, quantity: newQ } : c;
            }
            return c;
        }));
    };

    const cartTotal = cart.reduce((sum, item) => sum + (item.menuItem.price * item.quantity), 0);

    const handleCheckout = async (e) => {
        e.preventDefault();
        if (cart.length === 0) return;
        
        setIsProcessing(true);
        try {
            // 1. Create a table-less Dining Session
            const sessionPayload = {
                guestName: guestName || (checkoutMode === 'PAY_NOW' ? 'Walk-in' : 'Room Guest'),
                paxCount: 1,
                billingType: checkoutMode,
                stayId: checkoutMode === 'CHARGE_TO_ROOM' ? parseInt(selectedStayId) : null,
                tableId: null, // Critical: Table-less for POS
                status: 'OPEN',
                openedAt: new Date().toISOString()
            };
            
            const sessionRes = await api.post('/dining-sessions', sessionPayload);
            const sessionId = sessionRes.data.id;

            // 2. Add all items to the session orders
            const orderPromises = cart.map(item => api.post('/dining-orders', {
                sessionId: sessionId,
                menuItemId: item.menuItem.id,
                quantity: item.quantity,
                unitPrice: item.menuItem.price,
                totalAmount: item.menuItem.price * item.quantity,
                status: 'SERVED', // Fast service assumes served immediately
                orderedAt: new Date().toISOString()
            }));

            await Promise.all(orderPromises);

            // 3. Close & Settle the Session (which auto-routes to Folio if CHARGE_TO_ROOM)
            await api.patch(`/dining-sessions/${sessionId}/close`);

            // 4. Reset POS
            alert(checkoutMode === 'CHARGE_TO_ROOM' ? 'Successfully Charged to Room folio!' : 'Payment Processed Successfully!');
            setCart([]);
            setCheckoutMode(null);
            setGuestName('');
            setSelectedStayId('');

        } catch (err) {
            console.error('POS Checkout failed:', err);
            alert('Failed to process checkout.');
        } finally {
            setIsProcessing(false);
        }
    };

    const filteredMenu = selectedCategory === 'ALL' 
        ? menuItems 
        : menuItems.filter(m => m.category?.id === selectedCategory);

    return (
        <div className="flex flex-col h-[calc(100vh-100px)]">
            <div className="flex justify-between items-center mb-6">
            </div>

            <div className="flex flex-1 gap-6 min-h-0">
                {/* LEFT PANEL: Menu Catalog */}
                <div className="flex-[2] flex flex-col premium-card p-6 overflow-hidden">
                    {/* Category Tabs */}
                    <div className="flex gap-2 mb-6 overflow-x-auto pb-2 shrink-0 hide-scrollbar">
                        <button 
                            className={`px-5 py-2 whitespace-nowrap rounded-full font-bold text-[13px] transition-all ${selectedCategory === 'ALL' ? 'bg-primary text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                            onClick={() => setSelectedCategory('ALL')}
                        >
                            All Items
                        </button>
                        {categories.map(cat => (
                            <button 
                                key={cat.id}
                                className={`px-5 py-2 whitespace-nowrap rounded-full font-bold text-[13px] transition-all ${selectedCategory === cat.id ? 'bg-primary text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                onClick={() => setSelectedCategory(cat.id)}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>

                    {/* Menu Items Grid */}
                    <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-2 md:grid-cols-3 gap-4 auto-rows-max">
                        {loading ? (
                            <div className="col-span-full py-10 text-center text-slate-400 font-medium">Loading catalog...</div>
                        ) : filteredMenu.length === 0 ? (
                            <div className="col-span-full py-10 text-center text-slate-400 font-medium">No items found in this category.</div>
                        ) : (
                            filteredMenu.map(item => (
                                <div 
                                    key={item.id} 
                                    onClick={() => addToCart(item)}
                                    className="bg-white border-2 border-slate-100 hover:border-primary/50 hover:shadow-md cursor-pointer rounded-xl p-4 flex flex-col transition-all active:scale-95"
                                >
                                    <div className="font-bold text-slate-800 leading-tight mb-1">{item.name}</div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">{item.category?.name || 'Item'}</div>
                                    <div className="mt-auto flex justify-between items-center text-primary">
                                        <span className="font-extrabold text-sm">KSh {parseFloat(item.price).toLocaleString()}</span>
                                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center font-bold text-lg leading-none">+</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* RIGHT PANEL: The Ticket / Cart */}
                <div className="flex-[1] min-w-[320px] max-w-[400px] flex flex-col premium-card overflow-hidden">
                    <div className="p-5 border-b border-slate-100 shrink-0 bg-slate-50">
                        <h2 className="text-lg font-bold text-slate-800">Current Ticket</h2>
                        <p className="text-xs text-slate-500 font-medium">{cart.length} items</p>
                    </div>

                    {/* Cart Items */}
                    <div className="flex-1 overflow-y-auto p-5 pb-8 flex flex-col gap-3">
                        {cart.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-sm">
                                <svg className="w-12 h-12 mb-3 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                <span>Ticket is empty</span>
                            </div>
                        ) : (
                            cart.map(c => (
                                <div key={c.menuItem.id} className="flex flex-col bg-white border border-slate-100 p-3 rounded-xl shadow-sm relative group">
                                    <div className="flex justify-between items-start mb-2 pr-6">
                                        <span className="font-bold text-[13px] text-slate-800 leading-tight">{c.menuItem.name}</span>
                                        <span className="font-bold text-primary text-[13px]">KSh {(c.menuItem.price * c.quantity).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-1 border border-slate-200">
                                            <button onClick={() => updateQuantity(c.menuItem.id, -1)} className="w-6 h-6 rounded flex items-center justify-center bg-white border border-slate-200 text-slate-600 hover:text-black hover:border-slate-400 font-bold transition-colors">-</button>
                                            <span className="text-[12px] font-bold w-4 text-center">{c.quantity}</span>
                                            <button onClick={() => updateQuantity(c.menuItem.id, 1)} className="w-6 h-6 rounded flex items-center justify-center bg-white border border-slate-200 text-slate-600 hover:text-black hover:border-slate-400 font-bold transition-colors">+</button>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => removeFromCart(c.menuItem.id)}
                                        className="absolute top-2 right-2 text-red-300 hover:text-red-500 hover:bg-red-50 w-6 h-6 rounded-md flex items-center justify-center transition-colors"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Checkout Footer */}
                    <div className="p-5 border-t border-slate-200 bg-white shrink-0 shadow-[0_-10px_30px_rgba(0,0,0,0.03)] z-10">
                        <div className="flex justify-between items-center mb-5">
                            <span className="text-slate-500 font-bold uppercase tracking-widest text-xs">Total</span>
                            <span className="text-2xl font-extrabold text-primary">KSh {cartTotal.toLocaleString()}</span>
                        </div>

                        {!checkoutMode ? (
                            <div className="flex flex-col gap-2">
                                <button 
                                    disabled={cart.length === 0}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                    onClick={() => setCheckoutMode('PAY_NOW')}
                                >
                                    <CreditCard size={18} /> Pay Now (Walk-in)
                                </button>
                                <button 
                                    disabled={cart.length === 0}
                                    className="w-full bg-slate-800 hover:bg-black text-white font-bold py-3.5 rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                    onClick={() => setCheckoutMode('CHARGE_TO_ROOM')}
                                >
                                    <Bed size={18} /> Charge to Room
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleCheckout} className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="font-bold text-sm text-slate-800">
                                        {checkoutMode === 'PAY_NOW' ? 'Direct Payment' : 'Room Tab'}
                                    </h3>
                                    <button type="button" onClick={() => setCheckoutMode(null)} className="text-[11px] text-slate-500 hover:text-primary font-bold underline">Back</button>
                                </div>
                                
                                {checkoutMode === 'PAY_NOW' ? (
                                    <input 
                                        type="text" 
                                        placeholder="Guest Name (Optional)" 
                                        className="w-full p-2.5 rounded-lg border border-slate-300 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                                        value={guestName}
                                        onChange={e => setGuestName(e.target.value)}
                                    />
                                ) : (
                                    <select 
                                        required
                                        className="w-full p-2.5 rounded-lg border border-slate-300 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                                        value={selectedStayId}
                                        onChange={e => setSelectedStayId(e.target.value)}
                                    >
                                        <option value="">-- Select Active Room --</option>
                                        {stays.map(stay => (
                                            <option key={stay.id} value={stay.id}>Room {stay.roomId} - Res {stay.reservationId}</option>
                                        ))}
                                    </select>
                                )}

                                <button 
                                    type="submit" 
                                    disabled={isProcessing}
                                    className={`w-full mt-2 font-bold py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 ${isProcessing ? 'bg-slate-300 text-slate-500 cursor-wait' : 'bg-primary hover:bg-primary-dark text-white'}`}
                                >
                                    {isProcessing ? 'Processing...' : checkoutMode === 'PAY_NOW' ? `Confirm KSh ${cartTotal.toLocaleString()}` : 'Post Charge to Folio'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default POS;
