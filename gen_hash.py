import bcrypt
h = bcrypt.hashpw(b"password", bcrypt.gensalt(12))
print(h.decode())
