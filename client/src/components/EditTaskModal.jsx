import React from "react";

function EditTaskModal({ task, isOpen, onClose, onSave }) {
  const [title, setTitle] = React.useState(task?.title || "");
  const [completed, setCompleted] = React.useState(task?.completed || false);

  React.useEffect(() => {
    setTitle(task?.title || "");
    setCompleted(task?.completed || false);
  }, [task]);

  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 shadow-md w-full max-w-md space-y-4">
        <h3 className="text-lg font-bold text-gray-800">Edit Task</h3>
        <input
          className="w-full border px-4 py-2 rounded"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={completed}
            onChange={(e) => setCompleted(e.target.checked)}
          />
          <label>Completed</label>
        </div>
        <div className="flex justify-end gap-2">
          <button
            className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            onClick={() => onSave({ ...task, title, completed })}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditTaskModal;

