PYTHON ?= python3
VENV := .venv
VENV_PYTHON := $(VENV)/bin/python
VENV_PIP := $(VENV)/bin/pip
ARTIFACT := dist/PushChordGrid.amxd
MANIFEST := dist/manifest.json
PACKAGE := dist/PushChordGrid-v0.5.2-RC.zip
ARTIFACT_CHECKSUM := $(ARTIFACT).sha256
PACKAGE_CHECKSUM := $(PACKAGE).sha256
LIVE_SET := release/PushChordGrid-v0.5.2-RC Project/PushChordGrid-v0.5.2-RC.als

.PHONY: bootstrap test build validate package clean

bootstrap:
	$(PYTHON) -m venv $(VENV)
	$(VENV_PIP) install --requirement requirements-dev.lock

test:
	npm test
	$(VENV_PYTHON) -m pytest

build:
	$(VENV_PYTHON) build/build_device.py --output $(ARTIFACT)
	$(VENV_PYTHON) tools/validate_release.py $(ARTIFACT) --manifest $(MANIFEST) --write-manifest

validate:
	$(VENV_PYTHON) tools/validate_release.py $(ARTIFACT) --manifest $(MANIFEST)

package: build
	$(VENV_PYTHON) build/package_release.py --artifact $(ARTIFACT) --manifest $(MANIFEST) --live-set "$(LIVE_SET)" --output $(PACKAGE) --artifact-checksum $(ARTIFACT_CHECKSUM) --package-checksum $(PACKAGE_CHECKSUM)

clean:
	rm -f $(ARTIFACT) $(MANIFEST) $(PACKAGE) $(ARTIFACT_CHECKSUM) $(PACKAGE_CHECKSUM)
