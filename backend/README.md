# C8R8 - Backend

Follow these steps to properly operate the C8R8 backend (on Windows):

1- Clone our github repo from this link: https://github.com/husseintaan/c8r8 \
2- Create a SQL database with a specific name, say: exchange, admin: root, password: pass\
3- Create a db_config.py file to link the code to you database.\
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Enter only the following line: DB_CONFIG = 'mysql+pymysql://root:pass@localhost:3306/exchange'\
4- Make sure to install python on your device before proceeding.\
5- From CMD, open backend folder of the repo and create a virtual environment.
##### &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; `py -3 -m venv venv`
6- Enter the virtual environment.\
##### &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; `venv\Scripts\Activate` 
7- A "requirements.txt" file has all the dependencies needed. Install all these requirements.
##### &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; `pip install -r requirements.txt` 
8- Execute the following commands.
##### &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`set FLASK_APP=app.py` 
##### &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`set FLASK_ENVIRONMENT=development` 
9- Run python.
##### &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`python`
10- You will be directed to a python script. Execute the following commands to create the tables in the database.
##### &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`>>> from app import db`
##### &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`>>> db.create_all()`
##### &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`>>> exit()`
11- You should now be able to run the application.
##### &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`flask run`
