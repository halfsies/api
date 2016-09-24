# Use the base App Engine Docker image, based on debian jessie.
FROM gcr.io/google_appengine/nodejs

# Install updates
RUN apt-get update

# Clean aptitude
RUN apt-get clean

# Install node.js 6.4.0
RUN install_node v6.4.0

# Copy code to working directory
COPY . /app/

# Install npm dependencies
RUN npm install --unsafe-perm || \
  ((if [ -f npm-debug.log ]; then \
    cat npm-debug.log; \
  fi) && false)

# Open our default port
EXPOSE 8080

# Start up
CMD npm start
