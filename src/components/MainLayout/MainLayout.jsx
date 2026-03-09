import React from 'react';
import Sidebar from '../Sidebar/Sidebar';

const MainLayout = ({ children }) => {
    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 ml-[var(--sidebar-width)] bg-white">
                <header className="h-[var(--header-height)] px-8 flex items-center justify-between border-b border-border-gray bg-white sticky top-0 z-[90]">
                    <div className="flex-1"></div>
                    <div className="flex items-center gap-5">
                        <button className="bg-transparent border-none text-xl cursor-pointer relative text-text-slate hover:text-maroon transition-colors duration-300">
                            <span>🔔</span>
                            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-yellow rounded-full border-2 border-white"></span>
                        </button>
                    </div>
                </header>
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default MainLayout;
