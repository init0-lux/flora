FLO for Linux
=============

Github : https://github.com/ranchimall/FLO-wallet-core
Binary Release: https://github.com/ranchimall/FLO-wallet-core/releases

DESCRIPTION
-----------

flo-qt	: Run UI(QT) wallet
Use it to start the graphical interface of wallet

flo-cli	: Use CLI commands
Use it if you want to work on command line

flod	: Run Coin daemon
Use it if you want just the data from wallet and/or run it in background

Tips: Use `flo-qt` in general for easy UI interface

USAGE
-----

flo-qt
------
Run `./flo-qt` in 'terminal' open the UI wallet
Wait for the wallet to finish syncing
Send and receive FLO

flo-cli
-------
Run `./flo-cli <command>` in 'terminal'
Note: CLI commands can be used only when flo is running (either `flo-qt` or `flod`)
Run `./flo-cli -?` for more help and list of commands

flod
----
To start daemon, Run `./flod` in 'terminal'
To stop, Run `./flo-cli stop`
Note: flo-qt and flod cannot run simultaneously.
