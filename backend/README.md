# C8R8 - Backend
EECE 430L: Software Engineering Lab.

Follow these steps to properly operate the C8R8 backend:

1- Clone our github repo from this link: https://github.com/husseintaan/c8r8
2- Create a SQL database with a specific name, say: exchange, admin: root, password: pass
3- Create a db_config.py file to link the code to you database.
    Enter only the following line: DB_CONFIG = 'mysql+pymysql://root:pass@localhost:3306/exchange'
4- Make sure to install python on your device before proceeding.
5- From CMD, open backend folder of the repo and create a virtual environment.
   Use the following command: py -3 -m venv venv (on Windows)
6- Enter the virtual environment.
    Use the following command: venv\Scripts\Activate
7- A "requirements.txt" file has all the dependencies needed. Install all these requirements.
    Use the following command: pip install -r requirements.txt
8- Run python.
    Use the following command: python
9- You will be directed to a python script. Execute the following lines to create the tables in the database.
    >>> from app import db
    >>> db.create_all()
    >>> exit()
9- You should now be able to run the application.
    Use the command: flask run
