PYTHON ?= python3
VENV := .venv
VENV_PYTHON := $(VENV)/bin/python
VENV_PIP := $(VENV)/bin/pip
ARTIFACT := dist/PushChordGrid.amxd
MANIFEST := dist/manifest.json
PACKAGE := dist/PushChordGrid-WP2.zip

.PHONY: bootstrap test build validate package clean

bootstrap:
	$(PYTHON) -m venv $(VENV)
	$(VENV_PIP) install --requirement requirements-dev.lock

test:
	node --test tests/js/*.test.js
	$(VENV_PYTHON) -m pytest

build:
	$(VENV_PYTHON) build/build_device.py --output $(ARTIFACT)
	$(VENV_PYTHON) tools/validate_release.py $(ARTIFACT) --manifest $(MANIFEST) --write-manifest

validate:
	$(VENV_PYTHON) tools/validate_release.py $(ARTIFACT) --manifest $(MANIFEST)

package: build
	$(VENV_PYTHON) build/package_release.py --artifact $(ARTIFACT) --manifest $(MANIFEST) --output $(PACKAGE)

clean:
	rm -f $(ARTIFACT) $(MANIFEST) $(PACKAGE)
