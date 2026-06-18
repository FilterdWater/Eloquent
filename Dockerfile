FROM fedora:latest

RUN dnf install -y \
    curl \
    meson \
    gjs \
    gtk4-devel \
    libadwaita-devel \
    glib2-devel \
    libsoup3-devel \
    libportal-devel \
    blueprint-compiler \
    desktop-file-utils \
    gcc \
    java-25-openjdk-headless \
    git \
    make \
    unzip \
    && dnf clean all

ENV LANGUAGETOOL_VERSION=6.5
RUN curl -fsSL "https://languagetool.org/download/LanguageTool-${LANGUAGETOOL_VERSION}.zip" \
    -o /tmp/languagetool.zip \
    && unzip -q /tmp/languagetool.zip -d /opt \
    && mv "/opt/LanguageTool-${LANGUAGETOOL_VERSION}" /opt/LanguageTool \
    && rm /tmp/languagetool.zip \
    && chmod -R a+r /opt/LanguageTool

RUN echo '# LanguageTool server config' > /opt/server.properties \
    && chmod a+r /opt/server.properties

ARG USER_ID=1000
ARG GROUP_ID=1000

RUN groupadd -g $GROUP_ID dev && \
    useradd -m -u $USER_ID -g dev dev

RUN mkdir -p /tmp/runtime-dev && \
    chown -R dev:dev /tmp/runtime-dev

USER dev
WORKDIR /app
